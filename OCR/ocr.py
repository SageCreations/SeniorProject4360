#Requires Python 3.6 or higher due to f-strings
 
# Import libraries
import platform
import io
from tempfile import TemporaryDirectory
from pathlib import Path
 
import pytesseract
import pdf2image
from PIL import Image

current_os = platform.system()

#class to store the data passed from the front end.
class ImageInfo:
    def __init__(self, file_data: bytes, file_type: str, width: int, height: int):
        self.file_data: bytes = file_data
        self.file_type: str = file_type
        self.width: int = width
        self.height: int = height

    def __repr__(self):
        return (f"ImageInfo(file_data={self.file_data}, type={self.file_type}, "
                f"width={self.width}, height={self.height})")
    
    
    
#function to handle the byte data passed from the front end.
def handle_images(file_list: list[ImageInfo]) -> list[str]:
    
    images: list[Image] = []
    document_data: list [str] = []
      
    if current_os == "Windows":
        pytesseract.pytesseract.tesseract_cmd = '.\\windows\\Tesseract-OCR\\tesseract.exe'
        path_to_poppler_exe = Path('OCR\\poppler-24.08.0\\Library\\bin')
    elif current_os == "Linux":
        pytesseract.pytesseract.tesseract_cmd = 'OCR/linux/tesseract/bin/tesseract'
        path_to_poppler_exe = 'OCR/linux/poppler/bin'
    elif current_os == "Darwin":  # macOS returns 'Darwin'
        pytesseract.pytesseract.tesseract_cmd = 'OCR/darwin/tesseract/bin/tesseract'
        path_to_poppler_exe = 'OCR/darwin/poppler/bin'
    else:
        raise Exception("Unsupported OS")
       
     #Test each file in the list if its a PDF or an Image.   
       
    for file in file_list:
        #Test if the File type passed is a pdf.
        if file.file_type == "application/pdf":
            #Convert the PDF into a list of images using PIL/PDF2Image.
            pdf_pages = pdf2image.convert_from_bytes(file.file_data, 500, poppler_path=path_to_poppler_exe)
            
            # Iterate through all the images of the PDF and add them to the list page.
            for page_enumeration, page in enumerate(pdf_pages, start=1):
                images.append(page)
        
        #The front end should only accept images and PDFs at the moment so everything else
        #passed will be an image.  
        else:
            img = Image.open(io.BytesIO(file.file_data))
            images.append(img)
    
    #Iterate through the list of images to convert them into a list of strings
    #using pytesseract as the OCR.
    for image in images:
        document_data.append(pytesseract.image_to_string(image))
    
    #Pass the document_data back to the database as a list of strings.
    return document_data
  