//console.log2=console.log;
//console.log=(data)=>chrome.runtime.sendMessage({command:'log', data:data});
//constante para 1 segundo em milisegundos
const sec=1000;

//Funções que calculam a soma e a média dos elementos de um array
const sum=(arr)=>arr.length>0?arr.reduce((a,b)=>a+b):0;
const avg=(arr)=>arr.length>0?sum(arr)/arr.length: 0;

//Converte o handicap do formato 2.5,3.0  para 2.75, por exemplo
const calcHand=(hand_str)=>avg(hand_str.split(',').map(e=>Number(e) ));

//Shorthands $ e $$
const $=(q)=>document.querySelector(q);
const $$=(q)=>document.querySelectorAll(q);

//Shorthands $ e $$ para os elementos
Element.prototype.$ =function(q) { return this.querySelector(q)  };
Element.prototype.$$=function(q) { return this.querySelectorAll(q) };


// Função para dividir um array em partes menores de tamanho 'size'
 const chunkArray = (arr, size) => {
     const result = [];
     for (let i = 0; i < arr.length; i += size) {
         result.push(arr.slice(i, i + size));
     }
     return result;
 };


//Funcão genérica envia os eventos do contentScript o backgroundScript
const sendEvent=async(ev, input)=>{
   
   //Gera um uuid para cada evento a ser enviado
   const uuid=crypto.randomUUID();
   let completed=false;
   input['uuid']=uuid;
   
   //Envia o evento com o input( os paramentros do evento)
   chrome.runtime.sendMessage({command:ev, data:input});
   
   //Aguarda até a variável uuid ser preenchida com true
   while(!completed){
      await sleep(100);
      chrome.storage.local.get([uuid], v=>completed=v[uuid] ); 
   }
   
   //Remove a váriavel uuid  depois da conclusão evento
   chrome.storage.local.remove([uuid] ); 
}


//Todos os eventos possíveis 
const sendClick=async(input)=>await sendEvent('click', input);
const sendMove=async(input)=>await sendEvent('move', input);
const sendScroll=async(input)=>await sendEvent('scroll', input);
const sendType=async(input)=>await sendEvent('type', input);

//Envia o evento para baixar as stats
const insertStats=async(input)=> await sendEvent('stats',input);



//Move o cursor para centro da janela
const moveToCenterOfWindow=async()=>{
   const {screenX,screenY,outerWidth,outerHeight}=window;
   const x=screenX+outerWidth/2;
   const y=screenX+outerHeight/2;
   
   await sendMove({x,y});
}


//Aguarda até um elemento existir ou dar o timeout
const waitFor=async(el, timeout=20*sec)=>{
   const interval=100;
   let sum_interval=0
   while(el==null) {
      await sleep(interval);
      sum_interval+=interval;
      if (sum_interval>=timeout) break;
   }
   //Sempre retorna o elemento, senão existir será null
   return el;
}





const adjustBrower=()=>{
   if ( window.navigator.userAgent.includes('Chrome') ) return {aX:0, aY:-11};
   if ( window.navigator.userAgent.includes('Firefox') ) return {aX:1, aY:-5};
   return {aX:0, aY:0};
}

//Adiciona o evento rclick (click pelo nodejs) a todos os elementos
Element.prototype.rclick = async function(shift=[0,0,0,0]){
   
   //Ajuste de posição do navegador, 
   const {aX,aY}=adjustBrower();
   
   //Ajuste para não usar toda área do objecto
   const [sx1,sy1,sx2,sy2]=shift;
   
   //wX e wY, são a posição da janela do navegador em relação a tela
   const [wX, wY] = [window.screenX, window.screenY];
   
   //dX e dY diferença entre as medidas externas e internas da janela
   const [dX, dY] = [window.outerWidth - window.innerWidth, window.outerHeight - window.innerHeight];

   //eX, eY são a posição do elemento a ser clicado em relação a janela
   const rect = this.getBoundingClientRect();
   const [eX, eY] = [rect.left, rect.top];

   //Define as coordenadas da área do objeto em relação a tela, dados todos os ajustes
   const x1 = Math.ceil(eX + wX + dX / 2 + aX)+sx1;  //ajustar  
   const y1 = Math.ceil(eY + wY + dY+ aY)+sy1;
   const x2 = x1 + this.offsetWidth - 1 + sx2;
   const y2 = y1 + this.offsetHeight - 1 + sy2;

   //Envia a área para a função que faz o click pelo backgroundScript
   await sendClick({ x1,y1, x2,y2});

};


//Adiciona o evento rscroll (scroll pelo nodejs) a todos os elementos
Element.prototype.rscroll = async function(){
   await moveToCenterOfWindow();
   
   const eH=this.getBoundingClientRect().height;  //Altura do elemento
   const wH=window.innerHeight;  //Altura da janela 
   
   //dist é a distância do objeto ao centro da janela, no eixo Y
   let dist=this.getBoundingClientRect().y - wH/2;
   
   //Enquanto a dist maior a 1/4  da altura da janela faz o scroll
   while(Math.abs(dist)>wH/4 ){
      
      //Se a janela "scrollou" até o limite, para dar scroll
      if( 
         ((dist<0) && (window.scrollY==0))  ||
         ((dist>0) && (window.scrollY==window.scrollMaxY)) 
      ) break;
      
      //Desloca a scrollbar exatamente 1/2 da altura da janela
      await sendScroll({y: Math.sign(dist) * wH/2 });
      
      //Recalcula a distância do objeto ao centro da janela, no eixo Y
      dist=this.getBoundingClientRect().y - wH/2;
   }
  
};








//Lista todos os que está em 45:00 e calcula o índice para apostar
const getMatchList=()=>[...$$('.ovm-Fixture')].map((e,i)=>({
      pos:i,
      timer:e.$('.ovm-FixtureDetailsTwoWay_Timer, .ovm-InPlayTimer').innerText,
      home:e.$$('.ovm-FixtureDetailsTwoWay_TeamName')[0].innerText,
      away:e.$$('.ovm-FixtureDetailsTwoWay_TeamName')[1].innerText,
      rh:e.$$('.ovm-FixtureDetailsTwoWay_Team')[0].querySelectorAll('.ovm-FixtureDetailsTwoWay_RedCard').length,
      ra:e.$$('.ovm-FixtureDetailsTwoWay_Team')[1].querySelectorAll('.ovm-FixtureDetailsTwoWay_RedCard').length,
   })).filter(e=>e.timer=='45:00');
     // .filter(e=>!jaFoiListado(e.home,e.away));
   

//Lista todos os que está em 00:00 e calcula o índice para apostar
const getMatchList0=()=>[...$$('.ovm-Fixture')].map((e,i)=>({
      pos:i,
      timer:e.$('.ovm-FixtureDetailsTwoWay_Timer, .ovm-InPlayTimer').innerText,
      home:e.$$('.ovm-FixtureDetailsTwoWay_TeamName')[0].innerText,
      away:e.$$('.ovm-FixtureDetailsTwoWay_TeamName')[1].innerText,
      rh:e.$$('.ovm-FixtureDetailsTwoWay_Team')[0].querySelectorAll('.ovm-FixtureDetailsTwoWay_RedCard').length,
      ra:e.$$('.ovm-FixtureDetailsTwoWay_Team')[1].querySelectorAll('.ovm-FixtureDetailsTwoWay_RedCard').length,
   })).filter(e=>e.timer.split(':')[0]='00')
      .filter(e=>!e.home.includes('Esports') );

   





const getStat=async()=>{
   if ( !location.hash.includes('#/IP') )  return;
   
   const items=['dangerousattacks', 'shotsontarget', 'shotsofftarget', 'corners'];
   
   
   const recent_stats=(await fetch("https://bot-ao.com/recent_stats.php").then(r=>r.json() ) ).map(e=>e.home+e.away);
   
   const matches=(getMatchList()).filter(m=>!recent_stats.includes(m.home+m.away));
   
   console.log(matches);
   
   //Se não tiver nenhum jogo seja necessario colectar as estatisticas  sai fazer nada 
   if (!matches.length) return;
   
   
   const fixtures=[...$$('.ovm-Fixture')];
   
   const stats=[];
   
   for(let item of items){
      await $('.osm-SentenceLink').rclick();
      
      await $(`.osm-StatDropdownRow-${item}`).rclick();
      
      
      
      stats.push( matches.map(m=>[...fixtures[m.pos].$$('.osm-StatsColumn_Stat') ].map(e=>Number(e.innerText)  )) );

   }
   stats.push( matches.map(m=>[...fixtures[m.pos].$$('.ovm-StandardScoresSoccer_ScoreCol div div') ].map(e=>Number(e.innerText)  )) );
   
   
   await $('.ovm-ClassificationMarketSwitcherDropdownButton_Text').rclick();
   
   await $$('.ovm-ClassificationMarketSwitcherDropdownItem')[2].rclick();
   await sleep(2000);
   stats.push( matches.map(m=>[...fixtures[m.pos].$$('.ovm-ParticipantStackedCentered_Handicap') ].map(e=>calcHand(e.innerText)  )) );
   
   
   await $('.ovm-ClassificationMarketSwitcherDropdownButton_Text').rclick();
   
   await $$('.ovm-ClassificationMarketSwitcherDropdownItem')[3].rclick();
   
   
   
  
   const ts=Math.floor( (+new Date)/1000 );
   const dt=Math.floor( ts/(60*60*24) ) * (60*60*24);
   
   
   //'.ovm-StandardScoresSoccer_TeamOne 
   //'.ovm-StandardScoresSoccer_TeamTwo 
   const stats2=matches.map((m,i)=>({
      home:m.home,
      away:m.away,
      dah:stats[0][i][0],
      daa:stats[0][i][1],
      soh:stats[1][i][0],
      soa:stats[1][i][1],
      sfh:stats[2][i][0],
      sfa:stats[2][i][1],
      ch:stats[3][i][0],
      ca:stats[3][i][1],
      gh:stats[4][i][0],
      ga:stats[4][i][1],
      ah:stats[5][i][0],
      rh:m.rh,
      ra:m.ra,
      ts,
      dt,
      
   }));
   console.log(stats2);
   //console.log(JSON.stringify (stats2));
   //await insertStats({stats: JSON.stringify (stats2)});
   
   
   // Dividir stats2 em partes de 10 elementos
    const chunks = chunkArray(stats2, 10);
   
   
    // Enviar cada parte separadamente
    for (const chunk of chunks) {
        const url = 'https://bot-ao.com/insert_stats0.php?stats=' + encodeURIComponent(JSON.stringify(chunk));
        await fetch(url);
        console.log(url);
        await sleep(1000); // Pequeno delay entre requisições para evitar sobrecarga
    }
   
   
   
   //await fetch('https://bot-ao.com/insert_stats.php?stats='+encodeURI(JSON.stringify(stats2)) );

   //console.log('https://bot-ao.com/insert_stats.php?stats='+encodeURI(JSON.stringify(stats2)) );

}

      //.sort((a,b)=>a.pos-b.pos);
      







const getStat0=async()=>{
   if ( !location.hash.includes('#/IP') )  return;
   
   
   const recent_stats=(await fetch("https://bot-ao.com/recent_stats0.php").then(r=>r.json() ) ).map(e=>e.home+e.away);
  
   const matches=(getMatchList0()).filter(m=>!recent_stats.includes(m.home+m.away));
   
   console.log(matches);
   
   //Se não tiver nenhum jogo seja necessario colectar as estatisticas  sai fazer nada 
   if (!matches.length) return;
   
   
   const fixtures=[...$$('.ovm-Fixture')];
   
   const stats=[];
  
   
   await $('.ovm-ClassificationMarketSwitcherDropdownButton_Text').rclick();
   await $$('.ovm-ClassificationMarketSwitcherDropdownItem')[2].rclick();
   await sleep(2000);
   stats.push( matches.map(m=>[...fixtures[m.pos].$$('.ovm-ParticipantStackedCentered_Handicap') ].map(e=>calcHand(e.innerText)  )) );
   
   
   await $('.ovm-ClassificationMarketSwitcherDropdownButton_Text').rclick();
   await $$('.ovm-ClassificationMarketSwitcherDropdownItem')[3].rclick();
   await sleep(2000);
   stats.push( matches.map(m=>[...fixtures[m.pos].$$('.ovm-ParticipantStackedCentered_Handicap') ].map(e=>calcHand(e.innerText)  )) );
   
   
  
   const ts=Math.floor( (+new Date)/1000 );
   const dt=Math.floor( ts/(60*60*24) ) * (60*60*24);
   
   
   //'.ovm-StandardScoresSoccer_TeamOne 
   //'.ovm-StandardScoresSoccer_TeamTwo 
   const stats2=matches.map((m,i)=>({
      home:m.home,
      away:m.away,
      ah:stats[0][i][0],
      gl:stats[1][i][0],
      ts,
      dt,
   }));
   console.log(stats2);
   //console.log(JSON.stringify (stats2));
   //await insertStats({stats: JSON.stringify (stats2)});
   
   
    // Dividir stats2 em partes de 10 elementos
    const chunks = chunkArray(stats2, 10);
   
   
    // Enviar cada parte separadamente
    for (const chunk of chunks) {
        const url = 'https://bot-ao.com/insert_stats0.php?stats=' + encodeURIComponent(JSON.stringify(chunk));
        await fetch(url);
        console.log(url);
        await sleep(1000); // Pequeno delay entre requisições para evitar sobrecarga
    }
   
   
   
   //await fetch('https://bot-ao.com/insert_stats0.php?stats='+encodeURI(JSON.stringify(stats2)) );

   //console.log('https://bot-ao.com/insert_stats0.php?stats='+encodeURI(JSON.stringify(stats2)) );

}


const preReq=async()=>{
   if ( !location.hash.includes('#/IP') )  return;
   
   //Se não estiver na tela do Soccer, força para entrar nessa tela
   if(location.hash!="#/IP/B1") {
      location.hash="#/IP/B1"; 
      await sleep(5*sec);
   }
   
   //Se não estiver aparecendo o menu das estatisticas clica para abrir
   if(![...$('.ovm-StatsModeButton').classList].includes('ovm-StatsModeButton-enabled') ) await $('.ovm-StatsModeButton').click(); 
   
   
   //Aceita os cookies
   const cookie_accept=$('.ccm-CookieConsentPopup_Accept');
   if (cookie_accept) await cookie_accept.rclick();
   
 
   //Ao aparecer alguma oferta de Free Bet, clica para ignorar
   const free_bet_close_button=$('.pm-FreeBetsPushGraphicCloseButton');
   if( free_bet_close_button ) await free_bet_close_button.rclick();
   
   

   
};


const getStatsTC=async()=>{
 
   
      let stats3=[...$$('tr[data-match_id]')].filter(e=>e.querySelector('.match_status_minutes').innerText!='').map(e=>{
      const id=Number(e.getAttribute('data-match_id'));
      const m=Number(e.querySelector('.match_status_minutes').innerText.trim());
     
      const home=e.querySelector('.match_home a').innerText;
      const away=e.querySelector('.match_away a').innerText;
      const ah=Number(e.querySelector('.match_handicap').innerText.split('(')[1].split(')')[0]);
      
      const goal_div=e.querySelector('.match_total_goal_div').innerText;
      
      const gl=goal_div.includes('(') ? Number( e.querySelector('.match_total_goal_div').innerText.split('(')[1].slice(0,-1) ): Number( e.querySelector('.match_total_goal_div').innerText );
    
      const ts=Math.floor( (+new Date)/1000 );
      const dt=Math.floor( ts/(60*60*24) ) * (60*60*24);
     
      return {home,away,ah,gl,ts,dt,m};
   }).filter(e=>e.m>1 &&  e.m<30 );

   // Dividir stats2 em partes de 10 elementos
    const chunks = chunkArray(stats3, 10);
   
   
    // Enviar cada parte separadamente
    for (const chunk of chunks) {
        const url = 'https://bot-ao.com/insert_stats0.php?stats=' + encodeURIComponent(JSON.stringify(chunk));
        await fetch(url);
        console.log(url);
        await sleep(1000); // Pequeno delay entre requisições para evitar sobrecarga
    }
   


   //console.log('https://bot-ao.com/insert_stats0.php?stats='+encodeURI(JSON.stringify(stats3)));

   //await fetch('https://bot-ao.com/insert_stats0.php?stats='+encodeURI(JSON.stringify(stats3)) );
   
   
}





const main=async()=>{
  
   
   await getStat0();
   
   await getStat();
   
   
   
}



(async()=>{
   
   
   while(true) try{
      
      await sleep(30*1000);
      console.log('Loop TC');
      
      if ( !location.href.includes('today') )  continue;
      
      
   
      
      await getStatsTC();
      
   }
   catch(e){ console.log(e) }
   
   
})();


setInterval(()=>{
   if ( !location.href.includes('today') ) return;
   location.reload();
   
},2*60*1000);





(async()=>{
   

   
   
   //Loop a cada 10 segundos
   while(true) try{
   
      
      await sleep(30*1000)
      
      //Se não estiver na tela o Inplay  não faz nada
       if ( !location.hash.includes('#/IP') )  continue;
      
     
      
      console.log('Loop Principal');
   
      //Aguarda a página estar complementamente carregada
      await waitFor( $('.ovm-CompetitionList') );
 
     
            
      await preReq();
       
       
      await main();
      

   } 
   catch(e){ console.log(e) }
    
})();  
 