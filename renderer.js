// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const Path = require('path');
const OSS = require('ali-oss');
const fs = require("fs");
const { dialog } = require('electron').remote;
const ossDir = 'dev/static/'
let rootPath = '';
let jsonDir = '';
let imgDir = '';
let jsonDownloadDir = '';

const store = OSS({
    region: 'oss-cn-shenzhen',
    accessKeyId: 'LTAIpjoIH0R1rDaE',
    accessKeySecret: 'RaGaojX1bwfmBNkpBi44ICmTxD3grw',
    bucket: 'dy-official'
});

const updateFile = (dirPath, typeDirName) => {
    const filesPath = getFilesPath(dirPath);
    store.list({ prefix: ossDir + typeDirName, 'max-keys': 1000 }).then((res) => {
      console.log(res.objects);
        if (res.objects) {
          const list = res.objects.map((item) => {
            return item.name;
          })
          if (typeDirName === 'json') {
            list.map((file) => {
              store.delete(file).then((res) => {
                console.log(`文件${file}删除成功`);
              }).catch((err) => {
                console.log(err);
              });
            })
          }
          filesPut(filesPath, typeDirName);
        } else {
          filesPut(filesPath, typeDirName);
        }
    }).catch((err) =>{
      console.log(err);
    });
}
const existPath = (filesPath, typeDirName, fileSource) => {
  for (let i = 0; i < filesPath.length; i++) {
    if (fileSource === 'local') {
      console.log(typeDirName);
      let existStr = ''
      if (typeDirName === 'img/news') {
        existStr = 'news'
      } else {
        existStr = typeDirName;
      }
      console.log(filesPath[i].indexOf(`\\${existStr}\\`))
      if (filesPath[i].indexOf(`\\${existStr}\\`) === -1) {
        alert(`本地路径不对，路径需要包含${existStr}文件夹且文件夹不为空`);
        return false;
      }
    } else {
      if (jsonDownloadDir === '') {
        alert('下载文件请选择下载路径');
        return false;
      }
      if (filesPath[i].indexOf(`/${typeDirName}/`) === -1) {
        alert(`远程目录不存在文件夹${typeDirName}或文件夹为空`);
        return false;
      }
    }
    return true;
  }
}

const filesPut = (filesPath, typeDirName) => {
  if (!existPath(filesPath, typeDirName, 'local')) return;
    
  $('#content').append(`<p>上传${typeDirName}操作`);

  let count = 0;
  filesPath.forEach((item) => {
    let splitStr = '';
    if (typeDirName === 'json') {
      splitStr = typeDirName;
    }
    if (typeDirName === 'img/news') {
      splitStr = 'news';
    }
    let ossFileDir = ossDir + typeDirName + item.split(`\\${splitStr}`).pop().replace(/\\/g, '/');
    // console.log(ossFileDir)
    store.put(ossFileDir, item).then((res) => {
      $('#content').append(`<p>${++count}、更新文件${ossFileDir}成功</p>`);
    }).catch((err) => {
        console.log(err);
    });
  });
  alert('开始上传文件');
}

const getFile = (typeDirName) => {
    store.list({ prefix: ossDir + typeDirName, 'max-keys': 1000}).then((res) => {
        if (res.objects) {
          const list = res.objects.map((object) => {
            return object.name;
          }).filter((item) => {
              return item.indexOf('.') !== -1;
          })
          if (!existPath(list, typeDirName, 'remote')) return;

          $('#content').append(`<p>下载${typeDirName}操作`);
          console.log(list);
          let count = 0;
          list.map((file) => {
            let saveDir = '';
            if (typeDirName === 'json') {
              saveDir = typeDirName;
            }
            if (typeDirName === 'img/news') {
              saveDir = 'news';
            }
          
            const filePath = saveDir + file.split(typeDirName)[1];
            // console.log(filePath);
            createOutputDir(filePath);
            store.get(file, `${jsonDownloadDir}/${filePath}`).then((res) => {
              $('#content').append(`<p>${++count}、下载文件${file}成功`);
            }).catch((err) =>{
              console.log(err);
            });
          })
        alert('开始下载文件');
        } else {
          $('#content').append(`<p>oss文件为空`);
          console.log('oss文件为空');
        }
    }).catch((err) => {
        console.log(err);
    });
}

const getFilesPath = (dir) => {
  let jsonFiles = [];
  function findJsonFile(path){
    let files = fs.readdirSync(path);
    files.forEach(function (item, index) {
      let fPath = Path.join(path, item);
      let stat = fs.statSync(fPath);
      if(stat.isDirectory() === true) {
          findJsonFile(fPath);
      }
      if (stat.isFile() === true) {
        jsonFiles.push(fPath);
      }
    });
  }
  findJsonFile(dir);
  return jsonFiles;
}

const createOutputDir = (outputDir) => {
  const mkdirSync = (dirPath) => {
    const isExist = fs.existsSync(dirPath);
    if (!isExist) {
      fs.mkdirSync(dirPath)
    }
  }
  let strPath = '';
  const outputDirList = outputDir.split(/[/\\]/);

  outputDirList.forEach(function (dirName, index) {
    if (outputDirList.length - 1 === index) return;
    strPath +=  `\\${dirName}`
    let dirPath = `${jsonDownloadDir}${strPath}`;
    mkdirSync(dirPath)
  })
}


const selectDirPath = async () => {
  const path = await dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] })    
  return path;  
} 

$('.set-download-dir-wrap .select-dir-operate').eq(0).click(async () => {
  const dir = await selectDirPath();
  jsonDownloadDir = dir.filePaths[0];
  $('.set-download-dir-wrap .select-dir').eq(0).html(jsonDownloadDir);
})

$('.img-operate .select-dir-operate').eq(0).click(async () => {
  const dir = await selectDirPath();
  imgDir = dir.filePaths[0];
  $('.img-operate .select-dir').eq(0).html(imgDir);
})

$('.json-operate .select-dir-operate').eq(0).click(async () => {
  const dir = await selectDirPath();
  jsonDir = dir.filePaths[0];
  $('.json-operate .select-upload-dir').eq(0).html(jsonDir);
})

$('.json-operate .select-download-dir-operate').eq(0).click(async () => {
  const dir = await selectDirPath();
  jsonDownloadDir = dir.filePaths[0];
  $('.json-operate .select-download-dir').eq(0).html(jsonDownloadDir);
})

$('#json-download').click(() => {
  getFile('json');
})

$('#json-upload').click(() => {
  console.log(jsonDir);
  if (jsonDir === '') { 
    alert('未选择json文件，请选择');
    return;
  }
  updateFile(jsonDir, 'json')
})

$('#img-upload').click(() => {
  if (imgDir === '') { 
    alert('未选择图片文件，请选择');
    return;
  }
  updateFile(imgDir, 'img/news');
})

$('#img-download').click(() => {
  getFile('img/news');
})

$('#search-route-btn').click(() => {
  const route = $('#route-name').val();
  console.log(route);
  if (!route) {
    alert('请输入路由');
    return;
  } 
  console.log(route);
  const pcUrl = `https://www.dyinnovations.com/dev/news/${route}/index.html`
  const mobileUrl = `https://www.dyinnovations.com/dev/mobile/news/${route}/index.html`
  $('#pc-url').find('span').eq(0).attr('href', pcUrl);
  console.log()
  $('#pc-url').find('span').html(pcUrl);
  $('#mobile-url').find('span').eq(0).attr('href', mobileUrl);
  $('#mobile-url').find('span').html(mobileUrl);
})