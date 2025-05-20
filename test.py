import os
import io
import sys
import glob
import requests
import urllib.parse
from PIL import Image


def download_and_save(url, folder):
    response = requests.get(url)
    if response.status_code == 200:
        image = Image.open(io.BytesIO(response.content))
        fname = urllib.parse.unquote(os.path.basename(url).split(".")[0])  # decode URL encoding
        output_filename = f"{fname}.png"
        os.makedirs(folder, exist_ok=True)
        image.save(os.path.join(folder, output_filename), "PNG")
        print(f"Saved {output_filename} in {folder}")
    else:
        print(f"Failed to download {url}")


def process_file(url_file, folder):
    with open(url_file, "r") as f:
        for line in f:
            url = line.strip()
            if url:
                download_and_save(url, folder)


def print_image_aspect_ratios():
    output_file = "aspect_ratios.txt"
    with open(output_file, "w") as f:
        for folder in ["classes", "subclasses"]:
            image_files = glob.glob(os.path.join(folder, "*.png"))
            f.write(f"Directory: {folder}\n")
            for image_path in image_files:
                try:
                    with Image.open(image_path) as img:
                        w, h = img.size
                        ratio = w / h if h != 0 else 0
                        f.write(f"{os.path.basename(image_path)}: {ratio:.2f}\n")
                except Exception as e:
                    f.write(f"{os.path.basename(image_path)}: Error {e}\n")
            f.write("\n")
    print(f"Aspect ratios saved to {output_file}")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "aspect_ratios":
        print_image_aspect_ratios()
    else:
        # Process 'classes' URLs
        process_file("urls_classes.txt", "classes")
        # Process 'subclasses' URLs
        process_file("urls.txt", "subclasses")
