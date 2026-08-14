"writing check script" 
var fs=require('fs'
var d=fs.readFileSync('src/features/home/DashboardPage.tsx','utf8');  
console.log('Lines:',d.split('\n').length);  
