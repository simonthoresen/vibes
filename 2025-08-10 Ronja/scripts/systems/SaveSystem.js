class SaveSystem {
    static save(characterId, data) {
        const saveData = this.getAllSaves();
        saveData[characterId] = {
            ...data,
            timestamp: Date.now()
        };
        localStorage.setItem(Config.SAVE_KEY, JSON.stringify(saveData));
    }

    static load(characterId) {
        const saveData = this.getAllSaves();
        return saveData[characterId] || null;
    }

    static getAllSaves() {
        const saveData = localStorage.getItem(Config.SAVE_KEY);
        return saveData ? JSON.parse(saveData) : {};
    }

    static deleteSave(characterId) {
        const saveData = this.getAllSaves();
        delete saveData[characterId];
        localStorage.setItem(Config.SAVE_KEY, JSON.stringify(saveData));
    }

    static hasSave(characterId) {
        const saveData = this.getAllSaves();
        return !!saveData[characterId];
    }
}
