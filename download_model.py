import os
import sys
import urllib.request
import tarfile

MODEL_URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-en-v0_19.tar.bz2"
MODEL_DIR = "kokoro-en-v0_19"
TAR_FILE = "kokoro-en-v0_19.tar.bz2"

def report_progress(block_num, block_size, total_size):
    read_so_far = block_num * block_size
    if total_size > 0:
        percent = min(100, read_so_far * 100 / total_size)
        sys.stdout.write(f"\rDownloading model: {percent:.1f}% ({read_so_far / (1024*1024):.1f}MB / {total_size / (1024*1024):.1f}MB)")
    else:
        sys.stdout.write(f"\rDownloading model: {read_so_far / (1024*1024):.1f}MB downloaded")
    sys.stdout.flush()

def main():
    print("Checking for Kokoro TTS model...")
    if os.path.exists(MODEL_DIR):
        print(f"Model directory '{MODEL_DIR}' already exists. Skipping download.")
        return

    if not os.path.exists(TAR_FILE):
        print(f"Downloading model from {MODEL_URL}...")
        try:
            urllib.request.urlretrieve(MODEL_URL, TAR_FILE, report_progress)
            print("\nDownload completed successfully!")
        except Exception as e:
            print(f"\nError downloading model: {e}")
            print("Please check your internet connection or download the file manually.")
            sys.exit(1)
    else:
        print(f"Found existing archive '{TAR_FILE}', skipping download.")

    print(f"Extracting model files...")
    try:
        with tarfile.open(TAR_FILE, "r:bz2") as tar:
            tar.extractall()
        print("Extraction completed successfully!")
    except Exception as e:
        print(f"Error extracting archive: {e}")
        sys.exit(1)

    # Clean up archive
    try:
        os.remove(TAR_FILE)
        print("Cleaned up download archive.")
    except OSError:
        pass

    print("Kokoro model is ready to use!")

if __name__ == "__main__":
    main()
