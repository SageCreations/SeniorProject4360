# SeniorProject4360
Senior Project - Machine Learning and Optical Character Recognition for Document Processing in Supply Chain Logistics


## How to build an executable:
The executable will match the OS you build it on.
- Window's binaries are included
- MacOS might still need testing
- Linux has some dependencies you will need to install to your system for the program to work properly
  - Tesseract
  - Poppler executables, specifically `pdfinfo` (usually included already in your distro, but just in case it isn't.)  
```sh
pyinstaller --collect-all webui --add-data "views:views" --add-data "database:database" --add-data "OCR:OCR" -n DocHelp main.py
```


## How to get an API key
At the moment, we only support Cohere's API directly.

You can get a free usuage key by making account with them. 

- [Cohere's Website](https://cohere.com/)


## Architecture Overview
![Architecture Overview](docs/ArchitectureOverview.png "Architecture Overview")


## Development Enviroment
```sh
# create a virtual enviroment
python3 -m venv env

# activate the enviroment
# windows
env\Scripts\activate
# bash
source env/bin/activate

# install requirments for the project
pip install -r requirements.txt
```


