import electron from "electron";
const { contextBridge, ipcRenderer } = electron;
function makeApi() {
  return {
    sets: {
      list: () => ipcRenderer.invoke("sets:list"),
      create: (data) => ipcRenderer.invoke("sets:create", data),
      get: (id) => ipcRenderer.invoke("sets:get", id),
      update: (id, data) => ipcRenderer.invoke("sets:update", id, data),
      delete: (id) => ipcRenderer.invoke("sets:delete", id)
    },
    cards: {
      list: (setId) => ipcRenderer.invoke("cards:list", setId),
      create: (data) => ipcRenderer.invoke("cards:create", data),
      get: (id) => ipcRenderer.invoke("cards:get", id),
      update: (id, data) => ipcRenderer.invoke("cards:update", id, data),
      delete: (id) => ipcRenderer.invoke("cards:delete", id),
      reorder: (setId, orderedIds) => ipcRenderer.invoke("cards:reorder", setId, orderedIds)
    },
    templates: {
      list: () => ipcRenderer.invoke("templates:list"),
      installFromFolder: (folderPath) => ipcRenderer.invoke("templates:installFromFolder", folderPath)
    },
    export: {
      png: (options) => ipcRenderer.invoke("export:png", options),
      pdf: (options) => ipcRenderer.invoke("export:pdf", options),
      pickSavePath: (options) => ipcRenderer.invoke("export:pickSaveFile", options),
      pickFolder: () => ipcRenderer.invoke("export:pickFolder")
    },
    dialog: {
      openFile: (options) => ipcRenderer.invoke("dialog:openFile", options),
      openFolder: () => ipcRenderer.invoke("dialog:openFolder")
    }
  };
}
contextBridge.exposeInMainWorld("api", makeApi());
