const fs = require("fs").promises;
const fsSync = require("fs");
const readline = require("readline");

class MyFileSystem {
  constructor() {
    var storageFilePath;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.storageFilePath = "";
    var data = {};
  }

  showError(error) {
    //Universal error function
    console.error(error);
  }

  showInfo(info) {
    //This function is used to show additional information with error
    console.info(info);
  }

  isExpired(key) {
    //This is time-to-live function, to show if a key is expired
    return (
      this.data[key].aliveSeconds !== null &&
      (Date.now() - this.data[key].doj) / 1000 >= this.data[key].aliveSeconds
    );
  }

  checkAndDeleteIfExpired(key) {
    // This function checks and delete if key is expired
    if (this.data[key] !== undefined) {
      if (this.isExpired(key)) {
        this._deleteData(key);
        this.addDataToFile();
        return true;
      }
    }
    return false;
  }

  showDataToUser(
    key //show data avaiable in the data
  ) {
    if (this.checkAndDeleteIfExpired(key)) {
      this.showError(`The data for ${key} key is expired.`);
      return false;
    }
    if (this.checkAndShowErrorIfNotExpected(key, "Key does not exist.", {})) {
      console.log(`${key}: ${JSON.stringify(this.data[key])}`);
      return true;
    }
    return false;
  }

  _deleteData(
    key //delete data
  ) {
    if (this.data[key] !== undefined) {
      delete this.data[key];
      return true;
    }
    return false;
  }

  checkAndShowErrorIfNotExpected(key, error, expected) {
    if (typeof this.data[key] != typeof expected) {
      this.showError(error);
      return false;
    }
    return true;
  }

  checkIfKeyExists(
    key //check if key exists in the data
  ) {
    if (this.data[key] !== undefined) {
      return true;
    }
    return false;
  }

  deleteData(
    key //function to show delete data and update the file again
  ) {
    if (this.checkAndDeleteIfExpired(key)) {
      return false;
    }
    if (this._deleteData(key)) {
      this.addDataToFile();
      this.showInfo(`Deleted data of ${key}`);
      return true;
    }
    return false;
  }

  addData(
    key,
    value,
    aliveSeconds = "" //add data to storage file
  ) {
    key = key.trim();
    value = value.trim();
    aliveSeconds = aliveSeconds.trim() ? aliveSeconds.trim() : null;
    if (key.length == 0 || key.length > 32) {
      this.showError("Key should be less then 32 chars and not empty.");
      return false;
    }
    this.checkAndDeleteIfExpired(key);
    if (
      this.checkAndShowErrorIfNotExpected(
        key,
        `The key for ${key} is already present.`,
        undefined
      )
    ) {
      this.data[key] = {
        value: value,
        doj: Date.now(),
        aliveSeconds: aliveSeconds,
      };
      this.addDataToFile();
      this.showInfo(`Added data for ${key} successfully`);
      return true;
    }
    return false;
  }

  addDataToFile() {
    this.currentData.data = this.data;
    let toBeSaved = JSON.stringify(this.currentData);
    fsSync.writeFileSync(this.storageFilePath, toBeSaved);
  }

  isCorrectInput(expected, actual) {
    return expected.includes(actual);
  }

  promotChoices() {
    console.log(
      "\n To exit enter quit, 1. To show data, 2. Add Data, 3. Delete Data"
    );
    this.rl.setPrompt("Enter Choice> ");
    this.rl.prompt();
  }

  setCorrectPromot(key) {
    switch (key) {
      case "1":
        this.rl.setPrompt("Enter Key>");
        break;
      case "2":
        this.rl.setPrompt(
          "Enter Key, data, Time to live(optional). | separated>"
        );
        break;
      case "3":
        this.rl.setPrompt("Enter key to delete>");
        break;
      default:
        break;
    }
  }

  executeOnChoice(choice, data) {
    switch (choice) {
      case "1":
        return this.showDataToUser(data);
      case "2":
        return this.addData(...data.split("|"));
      case "3":
        return this.deleteData(data);
      default:
        return true;
    }
  }

  unlockFile() {
    this.currentData.fileInfo.isLocked = false;
    this.addDataToFile();
  }

  async importDataFromFile() {
    if (!(await this.isPathExist(this.storageFilePath))) {
      const defaultData = {
        data: {},
        fileInfo: { isLocked: false },
      };
      await fs.writeFile(this.storageFilePath, JSON.stringify(defaultData));
    }
    try {
      const temp = await fs.readFile(this.storageFilePath, "utf-8");
      const previousData = JSON.parse(temp);
      if (previousData.fileInfo.isLocked === true) {
        throw "File is used by another client.";
      } else {
        this.currentData = { ...previousData };
        this.data = previousData.data;
        this.currentData.fileInfo.isLocked = true;
        this.addDataToFile();
      }
    } catch (error) {
      this.showError("Something went wrong ! \n" + error);
      return false;
    }
    return true;
  }

  async isPathExist(path) {
    try {
      await fs.readdir(path);
    } catch (err) {
      try {
        await fs.readFile(path);
      } catch (error) {
        console.log(path);
        return false;
      }
    }
    return true;
  }

  async setDataFilePath(path, fileName) {
    if (!path) {
      path = ".";
    }
    if (!fileName) {
      fileName = "storage";
    }
    if (await this.isPathExist(path)) {
      this.storageFilePath = path + "/" + fileName + ".json";
      return await this.importDataFromFile();
    }
    return false;
  }

  mainCLI() {
    //Command line interface
    console.log("Welcome to my file system.");
    console.log(
      "Enter your file path and file name space seprated or press enter for default."
    );
    this.rl.setPrompt("path filename>");
    this.rl.prompt();
    let isFilePathSet = false;
    let choicePromot = true;
    let choice = null;
    let dataPromot = false;

    this.rl
      .on("line", async (line) => {
        if (line === "quit") {
          this.rl.close();
        }
        if (!isFilePathSet) {
          let temp = await this.setDataFilePath(...line.split(" "));
          if (temp) {
            isFilePathSet = true;
            this.promotChoices();
            choicePromot = false;
          } else {
            this.showError("Invalid file path");
            this.rl.prompt();
          }
        } else if (choicePromot) {
          this.promotChoices();
          choicePromot = false;
        } else if (dataPromot === false) {
          if (this.isCorrectInput(["1", "2", "3"], line)) {
            choice = line;
            dataPromot = true;
            this.setCorrectPromot(choice);
            this.rl.prompt();
          } else {
            this.showError("Invalid choice! try again");
            this.rl.prompt();
          }
        } else if (dataPromot === true) {
          if (this.executeOnChoice(choice, line)) {
            choice = null;
            dataPromot = false;
            this.promotChoices();
            choicePromot = false;
          } else {
            this.rl.prompt();
          }
        }
      })
      .on("close", function () {
        process.exit(0);
      });
  }
}

const myFileSystem = new MyFileSystem();
myFileSystem.mainCLI(); //mainCLI is the command line interface through which user can interact and do operations
process.on("exit", () => {
  myFileSystem.unlockFile();
});
