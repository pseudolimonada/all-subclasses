#!/usr/bin/env python3
import os
import requests
from urllib.parse import urlparse
from PIL import Image
from io import BytesIO
import time
import random


def create_directory(directory):
    """Create directory if it doesn't exist"""
    if not os.path.exists(directory):
        os.makedirs(directory)
        print(f"Created directory: {directory}")


def get_filename_from_url(url):
    """Extract a meaningful filename from URL, focusing on class/subclass identifiers"""
    path = urlparse(url).path

    # Look for class/subclass identifiers in the path segments
    path_segments = path.split("/")

    # Filter out empty segments and look for meaningful identifiers
    meaningful_segments = [segment for segment in path_segments if segment]

    # Try to find segments containing likely class/subclass terms
    for segment in meaningful_segments:
        # Look for typical class/subclass naming patterns
        if any(
            term in segment.lower()
            for term in [
                "-symbol",
                "cleric",
                "wizard",
                "druid",
                "barbarian",
                "paladin",
                "bard",
                "fighter",
                "monk",
                "ranger",
                "rogue",
                "sorcerer",
                "warlock",
            ]
        ):
            # Clean up the segment
            cleaned_name = segment.replace(".", "-").replace("_", "-")
            return f"{cleaned_name}.png"

    # If no meaningful segment found, use the basename as fallback
    filename = os.path.basename(path)
    if not filename or "." not in filename:
        return f"icon_{int(time.time())}_{random.randint(1000, 9999)}.png"

    # Get name without extension
    name = filename.split(".")[0]
    return f"{name}.png"


def download_and_save(url, save_path):
    """Download image from URL and save as PNG"""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, stream=True, timeout=10)
        response.raise_for_status()

        # Use PIL to open the image and save as PNG
        img = Image.open(BytesIO(response.content))
        img.save(save_path, "PNG")
        print(f"Successfully downloaded and saved: {save_path}")
        return True
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False


def main():
    # Define paths
    input_file = "urls_icons.txt"
    icons_dir = "icons"

    # Create icons directory if it doesn't exist
    create_directory(icons_dir)

    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} not found")
        return

    # Read URLs from file
    with open(input_file, "r") as f:
        urls = [line.strip() for line in f if line.strip()]

    print(f"Found {len(urls)} URLs to download")

    # Download and save each image
    successful_downloads = 0
    for url in urls:
        filename = get_filename_from_url(url)
        save_path = os.path.join(icons_dir, filename)

        # Add a small delay to be nice to the server
        time.sleep(0.5)

        if download_and_save(url, save_path):
            successful_downloads += 1

    print(
        f"Download complete. Successfully downloaded {successful_downloads} out of {len(urls)} images."
    )


if __name__ == "__main__":
    main()
