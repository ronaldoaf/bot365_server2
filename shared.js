var VARS;

//Defini os valores padrões para as variáveis
const default_vals={
   matches:[],
   stats:[],
            
};

//Espera por tantos milisegundos
const sleep=(ms)=> new Promise(resolve => setTimeout(resolve, ms));


//Caso a váriavel não esteja  defina, a define com uma valor padrão
const setDefVal=(var_str, def_val)=>{
   chrome.storage.local.get([var_str], (vars)=> {
      if ( vars[var_str]==undefined  ) chrome.storage.local.set({[var_str]: def_val});
   });
};

//Para cada váriavel não definida define-a com seu valor padrão
for( key of Object.keys(default_vals) ) setDefVal(key, default_vals[key]);

//Copia do chrome.storage.local para VARS
const setVars=()=>chrome.storage.local.get(Object.keys(default_vals), (vars)=>VARS=vars);

