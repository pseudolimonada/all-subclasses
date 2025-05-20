import os
import json
import cv2
import numpy as np
from pathlib import Path


def analyze_image(image_path):
    """Analyze an image to determine the centering offset needed."""
    try:
        # Read the image
        img = cv2.imread(str(image_path))
        if img is None:
            print(f"Could not read image: {image_path}")
            return None

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Apply thresholding to separate foreground from background
        _, thresh = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)

        # Find contours to detect the main content
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            print(f"No contours found in {image_path}")
            return None

        # Find the largest contour (likely the main content)
        main_contour = max(contours, key=cv2.contourArea)

        # Get the bounding rectangle
        x, y, w, h = cv2.boundingRect(main_contour)

        # Calculate the center of the content vs. the center of the image
        image_center_x = img.shape[1] / 2
        content_center_x = x + (w / 2)

        # Calculate the offset percentage
        offset_percentage = ((image_center_x - content_center_x) / image_center_x) * 100

        # Round to one decimal place for precision
        offset_percentage = round(offset_percentage, 1)

        print(f"Analyzed {image_path.name}: offset = {offset_percentage}%")
        return offset_percentage

    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None


def generate_offset_config():
    """Generate a configuration file with image offsets."""
    base_dir = Path(__file__).parent
    subclasses_dir = base_dir / "subclasses"

    if not subclasses_dir.exists():
        print(f"Subclasses directory not found: {subclasses_dir}")
        return

    # Dictionary to store image offsets
    offsets = {}

    # Process all PNG files in the subclasses directory
    for image_path in subclasses_dir.glob("*.png"):
        image_name = image_path.stem
        offset = analyze_image(image_path)
        if offset is not None:
            offsets[image_name] = offset

    # Save the offsets to a JSON file
    config_path = base_dir / "image-offsets.json"
    with open(config_path, "w") as f:
        json.dump(offsets, f, indent=2)

    print(f"Generated offset configuration at {config_path}")
    print(f"Analyzed {len(offsets)} images")


if __name__ == "__main__":
    generate_offset_config()
    print("Image analysis complete. Configuration file has been generated.")
