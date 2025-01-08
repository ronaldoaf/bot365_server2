

console.log('atualizou');



//Checa se uma lista de strings possui uma substring
const inList=(list, str)=>list.map(e=>e.includes(str)).reduce((a,b)=>a||b);




const checkTabs=()=>{
   
   chrome.tabs.query({},(tabs)=> {
      
      //Se a aba do Inplay não estiver aberta, abre-a
      if (!inList(tabs.map(tab=>tab.url), '#/IP/B1') ) chrome.tabs.create({url:'https://www.bet365.bet.br/?nr=1#/IP/B1'});
      
      if (!inList(tabs.map(tab=>tab.url), '/today') ) chrome.tabs.create({url:'https://www.totalcorner.com/match/today'});
      
      //Se exisitir mais de 1 aba de Inplay, fecha as outros deixando apenas a última
      const tabs_IP=tabs.filter(tab=>tab.url.includes('#/IP/') ).reverse().slice(1);
      for (let tab of tabs_IP) chrome.tabs.remove(tab.id);
      
      const tabs_TC=tabs.filter(tab=>tab.url.includes('/today') ).reverse().slice(1);
      for (let tab of tabs_TC) chrome.tabs.remove(tab.id);
      
      for (let tab of tabs) {
       
         //Deixa sempre ativa aba do Inplay
         if(tab.url.includes('#/IP/') ) chrome.tabs.update(tab.id, {active: true});
      
     
      }
   });
   
}




//=========================================================================================================
chrome.runtime.onMessage.addListener(async(msg,sender)=>{
   if (msg.command =='log') console.log(msg.data);   
  
   
   //Ação genérica usada nos eventos para evitar a repetição de manipulação das variáveis uuid
   const action=async(func)=>{
      chrome.storage.local.set({[msg.data.uuid]:false}); 
      await func();
      chrome.storage.local.set({[msg.data.uuid]:true}); 
   };
   

   if (msg.command =='click') await action(async()=>{      
      //Se tiver a propriedade x1, considera que um clique em uma área
      if(msg.data.hasOwnProperty('x1')){
         const {x1,y1,x2,y2}=msg.data;
         let res=await fetch(`http://localhost:1313/click_area?x1=${x1}&y1=${y1}&x2=${x2}&y2=${y2}`).then(r=>r.text() );
         console.log(res);
      }
      //Se senão, considera que é um único ponto
      else{
         const {x,y}=msg.data;
         let res=await fetch(`http://localhost:1313/click?x=${x}&y=${y}`).then(r=>r.text() );
         console.log(res);
      }
   });
   
   if (msg.command =='scroll') await action(async()=>{
      const {y}=msg.data;
      let res=await fetch(`http://localhost:1313/scroll?y=${y}`).then(r=>r.text() );
      console.log(res);
   });

 
   if (msg.command =='move') await action(async()=>{
      const {x,y}=msg.data;
      let res=await fetch(`http://localhost:1313/move?x=${x}&y=${y}`).then(r=>r.text() );
      console.log(res);
   });

   if (msg.command =='type') await action(async()=>{
      const {str}=msg.data;
      let res=await fetch(`http://localhost:1313/type?str=${str}`).then(r=>r.text() );
      console.log(res);
   });
   
   if (msg.command =='stats') await action(async()=>{
         const {stats}=msg.data;
         let res=await fetch(`https://bot-ao.com/insert_stats.php?stats=${stats}`).then(r=>r.json());
         console.log(res);
   });

   
   
   
});





//=========================================================================================================




setInterval(()=>{
      checkTabs();
},5000);
