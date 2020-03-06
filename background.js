function includes_list(lista, padrao){
	var contem=false;
	$(lista).each(function(){
		if(this.includes(padrao) ) contem=true;		
	});
	return contem;
	
}






//A cada 1 segundo verifica se as abas estão abetas
setInterval(function(){		
    tab_urls=[];
    
    chrome.tabs.query({},function(tabs){			
        $(tabs).each(function(){
            tab_urls.push(this.url);		
        });	
        if (!includes_list(tab_urls, '#/IP/') ) chrome.tabs.create({url:'https://www.288sb.com/#/IP/'});


    });
    
},5000);






