# SeniorProject4360
Senior Project - Machine Learning and Optical Character Recognition for Document Processing in Supply Chain Logistics



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


## How to build executable:
switch out the root folder in main.py main function!!!
```_internal/views```
```sh
pyinstaller --collect-all webui --add-data "views:views" --add-data "database:database" --add-data "OCR:OCR" -n DocHelp main.py
```


## TODO:
- refactor docs table in db
  - add field to store dataURL in docs table (we can reuse it for creating the previews attached the user message in chat history) 
  - attach docs to message when loading chat after rework
