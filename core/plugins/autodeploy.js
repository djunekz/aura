export default {
  name: "AutoDeploy",
  init: function(kernel){
    console.log("🚀 AutoDeploy plugin initialized!");

    const oldHandler = kernel.watcher.handleEvent;
    kernel.watcher.handleEvent = (event, filepath) => {
      if(event === 'change' && filepath.endsWith('.js')){
        if(kernel.networkWatcher.online){
          kernel.dashboard.log(`🚀 AutoDeploy: Suggest deploying ${filepath}`);
          kernel.aiHelper(`deploy ${filepath}`);
        }
      }
      if(oldHandler) oldHandler(event, filepath);
    };
  }
};
