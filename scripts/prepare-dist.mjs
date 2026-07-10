import {cp,mkdir,writeFile} from 'node:fs/promises';
await cp('dist/server/index.mjs','dist/server/index.js');
await mkdir('dist/.openai',{recursive:true});
await cp('.openai/hosting.json','dist/.openai/hosting.json');
await writeFile('dist/package.json',JSON.stringify({type:'module'}));
