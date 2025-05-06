# Requires Python 3.6 or higher due to f-strings

# Import libraries
import platform
import io
from tempfile import TemporaryDirectory
from pathlib import Path

import pytesseract
import pdf2image
from PIL import Image

current_os = platform.system()
# print(current_os)


# class to store the data passed from the front end.
class ImageInfo:
    def __init__(self, file_data: bytes, file_type: str, width: int, height: int):
        self.file_data: bytes = file_data
        self.file_type: str = file_type
        self.width: int = width
        self.height: int = height

    def __repr__(self):
        return (
            f"ImageInfo(file_data={self.file_data}, type={self.file_type}, "
            f"width={self.width}, height={self.height})"
        )


def handle_image(file: ImageInfo) -> str:

    images: list[Image] = []
    document_data: list[str] = []

    if getattr(sys, 'frozen', False):
        BASE_PATH = os.path.join(sys._MEIPASS)
    else:
        BASE_PATH = os.path.abspath(".")

    if current_os == "Windows":
        pytesseract.pytesseract.tesseract_cmd = os.path.join(BASE_PATH, 'OCR\\windows\\Tesseract-OCR\\tesseract.exe')
        path_to_poppler_exe = os.path.join(BASE_PATH, 'OCR\\windows\\poppler-24.08.0\\Library\\bin')
    elif current_os == "Linux":
        pytesseract.pytesseract.tesseract_cmd = '/usr/bin/tesseract'
        path_to_poppler_exe = '/usr/bin'
    elif current_os == "Darwin":  # macOS returns 'Darwin'
        pytesseract.pytesseract.tesseract_cmd = 'OCR/darwin/tesseract/bin/tesseract'
        path_to_poppler_exe = 'OCR/darwin/poppler/bin'
    else:
        raise Exception("Unsupported OS")

    # Test each file in the list if its a PDF or an Image.

    # Test if the File type passed is a pdf.
    if file.file_type == "application/pdf":
        # Convert the PDF into a list of images using PIL/PDF2Image.
        pdf_pages = pdf2image.convert_from_bytes(
            file.file_data, 500, poppler_path=path_to_poppler_exe
        )

        # Iterate through all the images of the PDF and add them to the list page.
        for page_enumeration, page in enumerate(pdf_pages, start=1):
            images.append(page)

    else:
        img = Image.open(io.BytesIO(file.file_data))
        images.append(img)

    # Iterate through the list of images to extract the text
    # using pytesseract as the OCR.
    for image in images:
        document_data.append(pytesseract.image_to_string(image))

    # return a single string of document_data concatentated with " "
    return " ".join(document_data)
