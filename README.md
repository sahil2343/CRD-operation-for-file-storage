This Project is made using Node.js

## Available Scripts

In the project directory run 'node app.js'

## To create file

Please enter data in this format.You have to choose 2nd option to create.<br>
'key | data | time-to-live(optional)'

## To Show data

Please enter the key, you want to read.

## To delete data

Please enter the key to delete.

## Requirements

### Functional Requirement

1. You can provide an optional path in this format for example "C:\Users\Asus\storage,<br>json", if name of file is not present it will create a default name as "storage.<br>json". And if path is not provided, it will create a path in the current directory.

2. The key is always a string and value is capped at 32 chars.<br>
3. Error is showed if key is already exists and create is invoked.<br>
4. The data is showed as JSON object to user.<br>
5. Delete operation can be done by providing a key.<br>
6. Time-to-live property is implemeted properly.<br>
7. Appropriate errors are shown when data entered incorrectly.

### Non functional requirements

1. More than one client process cannot modify the storage data file and it is implemented properly.
