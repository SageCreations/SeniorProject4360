# SeniorProject4360
Senior Project - Machine Learning and Optical Character Recognition for Document Processing in Supply Chain Logistics



## Architecture Overview
![Architecture Overview](docs/ArchitectureOverview.png "Architecture Overview")


## How to build executable:
switch out the root folder in main.py main function!!!
```_internal/views```
```sh
pyinstaller --collect-all webui --add-data "views:views" --add-data "database:database" --add-data "OCR:OCR" -n DocHelp main.py
```


## TODO:
- add a requirements.txt
- refactor docs table in db
  - add field to store dataURL in docs table (we can reuse it for creating the previews attached the user message in chat history) 
  - attach docs to message when loading chat after rework
