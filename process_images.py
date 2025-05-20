import os
import cv2
import json
import numpy as np
from PIL import Image


def rgb_to_hsv(rgb):
    # Convert hex color to HSV
    r = int(rgb[1:3], 16) / 255.0
    g = int(rgb[3:5], 16) / 255.0
    b = int(rgb[5:7], 16) / 255.0
    hsv = cv2.cvtColor(np.uint8([[[b * 255, g * 255, r * 255]]]), cv2.COLOR_BGR2HSV)[0][0]
    return hsv


def find_frame_bounds(image_path, is_class=False, smooth_contours=False):
    # Read image with alpha channel
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None or img.shape[2] < 4:
        raise ValueError(f"Could not load image with alpha: {image_path}")

    height, width = img.shape[:2]

    # Convert BGR to HSV
    hsv = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2HSV)

    # Create mask for the golden frame color (#B79461)
    # Convert target RGB to HSV
    target_color = np.uint8([[[0x61, 0x94, 0xB7]]])  # BGR format
    target_hsv = cv2.cvtColor(target_color, cv2.COLOR_BGR2HSV)[0][0]

    # Define tight range around the golden color
    hue_range = 3
    sat_range = 40
    val_range = 40

    lower_gold = np.array(
        [
            max(0, target_hsv[0] - hue_range),
            max(0, target_hsv[1] - sat_range),
            max(0, target_hsv[2] - val_range),
        ]
    )
    upper_gold = np.array(
        [
            min(180, target_hsv[0] + hue_range),
            min(255, target_hsv[1] + sat_range),
            min(255, target_hsv[2] + val_range),
        ]
    )

    # Create color mask and combine with alpha
    color_mask = cv2.inRange(hsv, lower_gold, upper_gold)
    alpha_mask = img[:, :, 3] > 127
    frame_mask = cv2.bitwise_and(color_mask, color_mask, mask=alpha_mask.astype(np.uint8))

    # Clean up the mask
    kernel = np.ones((3, 3), np.uint8)
    frame_mask = cv2.morphologyEx(frame_mask, cv2.MORPH_CLOSE, kernel)

    if smooth_contours:
        smoothed_bounds = smooth_to_rectangle(frame_mask)
        if smoothed_bounds:
            # Add small padding
            padding = 2
            return {
                "x": max(0, smoothed_bounds["x"] - padding),
                "y": max(0, smoothed_bounds["y"] - padding),
                "width": min(width - smoothed_bounds["x"], smoothed_bounds["width"] + 2 * padding),
                "height": min(
                    height - smoothed_bounds["y"], smoothed_bounds["height"] + 2 * padding
                ),
            }

    # Create edge maps from the cleaned frame mask
    sobel_h = cv2.Sobel(frame_mask, cv2.CV_64F, 0, 1, ksize=3)
    sobel_v = cv2.Sobel(frame_mask, cv2.CV_64F, 1, 0, ksize=3)

    # Get projections
    h_projection = np.sum(np.abs(sobel_h), axis=1)
    v_projection = np.sum(np.abs(sobel_v), axis=0)

    # Find peaks in projections - these are the likely positions of frame edges
    h_peaks = find_significant_peaks(h_projection, min_height=width * 0.3)
    v_peaks = find_significant_peaks(v_projection, min_height=height * 0.3)

    # Expected aspect ratio
    if is_class:
        expected_ratio = 1.57 / 1.16  # Exact class ratio
    else:
        expected_ratio = 1.65 / 0.55  # Exact subclass ratio

    # If we have at least 3 edges (2 horizontal + 1 vertical or 1 horizontal + 2 vertical)
    if len(h_peaks) >= 2 and len(v_peaks) >= 1:
        # We have both horizontal edges and at least one vertical
        h_peaks.sort()
        v_peaks.sort()

        top_y = h_peaks[0]
        bottom_y = h_peaks[-1]

        # If we have only one vertical edge, infer the other one
        if len(v_peaks) == 1:
            detected_x = v_peaks[0]
            frame_height = bottom_y - top_y
            frame_width = frame_height / expected_ratio

            # Determine if the detected edge is left or right
            if detected_x < width / 2:
                # It's the left edge, infer right edge
                left_x = detected_x
                right_x = left_x + frame_width
            else:
                # It's the right edge, infer left edge
                right_x = detected_x
                left_x = right_x - frame_width
        else:
            # We have both vertical edges
            left_x = v_peaks[0]
            right_x = v_peaks[-1]

    elif len(h_peaks) >= 1 and len(v_peaks) >= 2:
        # We have both vertical edges and at least one horizontal
        h_peaks.sort()
        v_peaks.sort()

        left_x = v_peaks[0]
        right_x = v_peaks[-1]

        # If we have only one horizontal edge, infer the other one
        if len(h_peaks) == 1:
            detected_y = h_peaks[0]
            frame_width = right_x - left_x
            frame_height = frame_width * expected_ratio

            # Determine if the detected edge is top or bottom
            if detected_y < height / 2:
                # It's the top edge, infer bottom edge
                top_y = detected_y
                bottom_y = top_y + frame_height
            else:
                # It's the bottom edge, infer top edge
                bottom_y = detected_y
                top_y = bottom_y - frame_height
        else:
            # We have both horizontal edges
            top_y = h_peaks[0]
            bottom_y = h_peaks[-1]

    # If we haven't found at least 3 edges, raise an error
    elif len(h_peaks) + len(v_peaks) < 3:
        raise ValueError(f"Could not find enough frame edges in {image_path}")

    # If we have exactly 3 edges total, try to infer the 4th
    else:
        # Sort peaks
        h_peaks.sort()
        v_peaks.sort()

        # Case 1: 2 horizontal, 1 vertical
        if len(h_peaks) == 2 and len(v_peaks) == 1:
            top_y = h_peaks[0]
            bottom_y = h_peaks[1]
            detected_x = v_peaks[0]

            # Calculate width based on height and aspect ratio
            frame_height = bottom_y - top_y
            frame_width = frame_height / expected_ratio

            # Determine if detected edge is left or right
            if detected_x < width / 2:
                # Left edge detected
                left_x = detected_x
                right_x = left_x + frame_width
            else:
                # Right edge detected
                right_x = detected_x
                left_x = right_x - frame_width

        # Case 2: 1 horizontal, 2 vertical
        elif len(h_peaks) == 1 and len(v_peaks) == 2:
            left_x = v_peaks[0]
            right_x = v_peaks[1]
            detected_y = h_peaks[0]

            # Calculate height based on width and aspect ratio
            frame_width = right_x - left_x
            frame_height = frame_width * expected_ratio

            # Determine if detected edge is top or bottom
            if detected_y < height / 2:
                # Top edge detected
                top_y = detected_y
                bottom_y = top_y + frame_height
            else:
                # Bottom edge detected
                bottom_y = detected_y
                top_y = bottom_y - frame_height

    # Ensure values are within image bounds
    left_x = max(0, int(left_x))
    right_x = min(width, int(right_x))
    top_y = max(0, int(top_y))
    bottom_y = min(height, int(bottom_y))

    # Calculate final dimensions
    frame_width = right_x - left_x
    frame_height = bottom_y - top_y

    # Small padding
    padding = 2
    return {
        "x": max(0, left_x - padding),
        "y": max(0, top_y - padding),
        "width": min(width - left_x, frame_width + 2 * padding),
        "height": min(height - top_y, frame_height + 2 * padding),
    }


def smooth_to_rectangle(mask):
    """
    Smooth irregular contours into a clean rectangle.
    """
    # Find contours in the mask
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return None

    # Find largest contour
    largest_contour = max(contours, key=cv2.contourArea)

    # First try minimal area rectangle
    rect = cv2.minAreaRect(largest_contour)
    box = cv2.boxPoints(rect)
    box = np.array(box, dtype=np.int_)  # Changed from np.int0 to np.int_

    # Get bounding coordinates
    x_coords = box[:, 0]
    y_coords = box[:, 1]

    return {
        "x": int(min(x_coords)),
        "y": int(min(y_coords)),
        "width": int(max(x_coords) - min(x_coords)),
        "height": int(max(y_coords) - min(y_coords)),
    }


def find_significant_peaks(projection, min_height):
    """
    Find significant peaks in a projection array, including clusters of smaller peaks.
    """
    # Normalize projection
    if np.max(projection) > 0:
        normalized = projection / np.max(projection)
    else:
        return []

    # Apply smoothing to reduce noise
    window_size = 5
    smoothed = np.convolve(normalized, np.ones(window_size) / window_size, mode="same")

    # First find all peaks, including smaller ones (2-8% of image size)
    all_peaks = []
    small_threshold = 0.1  # Capture even small peaks

    for i in range(1, len(smoothed) - 1):
        if (
            smoothed[i] > small_threshold
            and smoothed[i] > smoothed[i - 1]
            and smoothed[i] > smoothed[i + 1]
        ):
            all_peaks.append((i, smoothed[i]))  # Store index and magnitude

    # No peaks found
    if not all_peaks:
        return []

    # Group peaks into clusters with adaptive window
    clusters = []
    min_dist = max(10, int(len(projection) * 0.01))  # Dynamic minimum distance
    max_dist = max(20, int(len(projection) * 0.03))  # Dynamic maximum distance
    current_cluster = [all_peaks[0]]

    # Calculate gradient continuity scores
    grad_scores = np.gradient(smoothed)

    for i in range(1, len(all_peaks)):
        current_peak = all_peaks[i]
        last_peak = all_peaks[i - 1]
        peak_distance = current_peak[0] - last_peak[0]

        # Calculate gradient continuity score
        region_start = max(0, last_peak[0])
        region_end = min(len(grad_scores), current_peak[0])
        grad_continuity = np.mean(np.abs(grad_scores[region_start:region_end]))

        # Adaptive clustering based on distance and gradient continuity
        if peak_distance < max_dist and (peak_distance < min_dist or grad_continuity > 0.1):
            # Peaks are close or have strong gradient continuity
            current_cluster.append(current_peak)
        else:
            if len(current_cluster) > 0:
                # Score cluster based on peak heights and gradient support
                cluster_score = sum(p[1] for p in current_cluster) * (1 + grad_continuity)
                clusters.append((current_cluster, cluster_score))
            current_cluster = [current_peak]

    # Add the last cluster with scoring
    if current_cluster:
        region_start = max(0, current_cluster[0][0])
        region_end = min(len(grad_scores), current_cluster[-1][0])
        grad_continuity = np.mean(np.abs(grad_scores[region_start:region_end]))
        cluster_score = sum(p[1] for p in current_cluster) * (1 + grad_continuity)
        clusters.append((current_cluster, cluster_score))

    # Sort clusters by score and extract positions
    clusters.sort(key=lambda x: x[1], reverse=True)
    scored_clusters = []

    for cluster, score in clusters:
        # Weight peaks by their height and position consistency
        weights = [p[1] for p in cluster]
        positions = [p[0] for p in cluster]
        avg_pos = int(np.average(positions, weights=weights))

        # Calculate cluster spread
        spread = np.std(positions)
        if spread < max_dist:  # Only consider tight clusters
            scored_clusters.append((avg_pos, score))

    # Sort by score
    scored_clusters.sort(key=lambda x: x[1], reverse=True)

    # Get positions of best clusters
    peak_positions = [pos for pos, _ in scored_clusters[:4]]  # Take up to 4 best clusters

    # If we found at least the required peaks, return them, otherwise use the original method
    if len(peak_positions) >= 2:
        return sorted(peak_positions)
    else:
        # Fall back to original method for robustness
        strong_peaks = []
        for i in range(1, len(smoothed) - 1):
            if (
                smoothed[i] > 0.5
                and smoothed[i] > smoothed[i - 1]
                and smoothed[i] > smoothed[i + 1]
            ):
                strong_peaks.append(i)
        return strong_peaks


def process_image(image_path, is_class=False, smooth_contours=False):
    try:
        # Open image with PIL
        img = Image.open(image_path)

        # Find frame bounds with optional smoothing
        bounds = find_frame_bounds(image_path, is_class, smooth_contours)

        # Create output directory
        output_dir = "processed"
        os.makedirs(output_dir, exist_ok=True)

        basename = os.path.basename(image_path)
        name = os.path.splitext(basename)[0]

        # Create clipped version
        clipped = img.crop(
            (
                bounds["x"],
                bounds["y"],
                bounds["x"] + bounds["width"],
                bounds["y"] + bounds["height"],
            )
        )

        # Save processed images
        clipped.save(os.path.join(output_dir, f"{name}_clipped.png"))
        print(f"Successfully processed: {basename} - bounds: {bounds}")
        return bounds

    except Exception as e:
        print(f"Error processing {image_path}: {str(e)}")
        return None


def process_all_images(smooth_contours=False):
    bounds_data = {}

    # Process classes
    if os.path.exists("classes"):
        bounds_data["classes"] = {}
        for image_file in os.listdir("classes"):
            if image_file.endswith((".png", ".webp")):
                image_path = os.path.join("classes", image_file)
                bounds = process_image(image_path, is_class=True, smooth_contours=smooth_contours)
                if bounds:
                    bounds_data["classes"][image_file] = bounds

    # Process subclasses
    if os.path.exists("subclasses"):
        bounds_data["subclasses"] = {}
        for image_file in os.listdir("subclasses"):
            if image_file.endswith((".png", ".webp")):
                image_path = os.path.join("subclasses", image_file)
                bounds = process_image(image_path, is_class=False, smooth_contours=smooth_contours)
                if bounds:
                    bounds_data["subclasses"][image_file] = bounds

    # # Save bounds data
    # with open("image_bounds.json", "w") as f:
    #     json.dump(bounds_data, f, indent=2)

    print("Processing complete. Check image_bounds.json for results.")


if __name__ == "__main__":
    process_all_images(smooth_contours=True)
