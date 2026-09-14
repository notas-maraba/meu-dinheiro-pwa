import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut,setPersistence,browserLocalPersistence} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import {getFirestore,doc,getDocFromServer,onSnapshot,runTransaction,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';
import {firebaseConfig} from './firebase-config.js';

const $=s=>document.querySelector(s),bridge=window.financeBridge;
const app=initializeApp(firebaseConfig),auth=getAuth(app),store=getFirestore(app);
let user=null,ref=null,revision=0,dirty=null,saving=false,conflict=false,unlisten=null,session=0;
const status=$('#sync-status'),gate=$('#account-gate'),message=$('#account-message');
function state(text){status.textContent=text}
function lock(text){gate.hidden=false;$('.shell').inert=true;$('#mobile-nav').inert=true;message.textContent=text}
function unlock(){gate.hidden=true;$('.shell').inert=false;$('#mobile-nav').inert=false}
function key(){return 'meu-dinheiro-account-'+user.uid}
function local(){try{return JSON.parse(localStorage.getItem(key()))}catch{return null}}
function remember(data,pending){try{localStorage.setItem(key(),JSON.stringify({data,revision,pending}));return true}catch{state('Falha na cópia local. Exporte um backup.');return false}}
function decode(data){return bridge.validate(JSON.parse(data.payload))}
function errorText(e){return ({'auth/popup-blocked':'Permita a janela de login do Google e tente novamente.','auth/popup-closed-by-user':'Login cancelado. Toque em Entrar com Google para tentar novamente.','auth/unauthorized-domain':'Este endereço ainda não está autorizado no Firebase.','permission-denied':'O banco recusou o acesso. Seus dados locais foram preservados.','unavailable':'Sem conexão com o banco. Tente novamente quando estiver online.'})[e.code]||'Não foi possível conectar. Tente novamente.'}

window.financeCloudSave=data=>{if(!user||!ref){state('Entre na conta antes de salvar.');return}dirty=data;remember(data,true);state(conflict?'Conflito: escolha qual versão carregar.':'Salvando na conta…');$('#retry-sync').hidden=false;if(!conflict)flush()};
async function flush(){if(saving||!dirty||!ref||conflict)return;const id=session,activeRef=ref;const data=dirty,payload=JSON.stringify(data),base=revision;
 if(new TextEncoder().encode(payload).length>=890000){state('Orçamento muito grande. Exporte um backup antes de reduzir registros.');return}
 saving=true;state('Salvando na conta…');
 try{const next=await runTransaction(store,async tx=>{const snap=await tx.get(activeRef),remote=snap.exists()?snap.data().revision:0;if(remote!==base)throw Object.assign(new Error('conflict'),{code:'budget-conflict'});tx.set(activeRef,{payload,revision:base+1,updatedAt:serverTimestamp()});return base+1});if(id!==session)return;revision=next;if(dirty===data)dirty=null;remember(dirty||data,!!dirty);state(dirty?'Salvando na conta…':'Salvo na conta');$('#retry-sync').hidden=!dirty;}
 catch(e){if(id!==session)return;if(e.code==='budget-conflict'){conflict=true;$('#resolve-conflict').hidden=false;state('Outra versão foi salva em outro aparelho.');}else state(errorText(e));}
 finally{if(id===session){saving=false;if(dirty&&!conflict&&revision>base)flush()}}
}

async function connect(u){session++;const id=session;if(unlisten)unlisten();unlisten=null;user=u;ref=null;dirty=null;saving=false;conflict=false;$('#resolve-conflict').hidden=true;$('#retry-sync').hidden=true;$('#migrate-local').hidden=true;
 if(!u){bridge.apply(bridge.empty());$('#account-name').textContent='Sua conta';$('#logout').hidden=true;$('#google-login').hidden=false;lock('Entre com Google para acessar seu orçamento em qualquer aparelho.');state('Não conectado');return}
 $('#account-name').textContent=u.email||u.displayName||'Minha conta';$('#logout').hidden=false;$('#google-login').hidden=true;lock('Carregando seu orçamento…');ref=doc(store,'budgets',u.uid);const cached=local();
 try{const snap=await getDocFromServer(ref);if(id!==session)return;revision=snap.exists()?snap.data().revision:0;
  if(cached?.pending){dirty=bridge.validate(cached.data);bridge.apply(dirty);if(cached.revision!==revision){conflict=true;$('#resolve-conflict').hidden=false;state('Há alterações locais e uma versão diferente na conta.')}else state('Enviando alterações pendentes…');}
  else if(snap.exists()){const data=decode(snap.data());bridge.apply(data);remember(data,false);state('Salvo na conta');}
  else{bridge.apply(bridge.empty());remember(bridge.snapshot(),false);state('Conta pronta. Cadastre suas contas ou importe um backup.');}
  unlock();$('#retry-account').hidden=true;
  if(!snap.exists()&&!cached?.pending){let legacy;try{legacy=JSON.parse(localStorage.getItem('meu-dinheiro-v1'))}catch{}if(legacy?.transactions?.length){$('#migrate-local').hidden=false;$('#migrate-local').onclick=()=>{if(confirm('Enviar o orçamento deste navegador para sua conta Firebase?')){bridge.apply(bridge.validate(legacy));window.financeCloudSave(bridge.snapshot());$('#migrate-local').hidden=true}}}}
  unlisten=onSnapshot(ref,s=>{if(id!==session||!s.exists()||s.metadata.hasPendingWrites)return;const remote=s.data();if(remote.revision<=revision||saving)return;if(dirty){conflict=true;$('#resolve-conflict').hidden=false;state('Outra versão foi salva em outro aparelho.');return}try{revision=remote.revision;const data=decode(remote);bridge.apply(data);remember(data,false);state('Atualizado da conta')}catch{state('Não foi possível carregar a versão da conta.')}},e=>{if(id===session)state(errorText(e))});
  if(dirty&&!conflict)flush();
 }catch(e){if(id!==session)return;$('#retry-account').hidden=false;if(cached?.data){try{revision=cached.revision||0;dirty=cached.pending?bridge.validate(cached.data):null;bridge.apply(bridge.validate(cached.data));unlock();state('Offline: cópia deste aparelho. Reconecte para sincronizar.');$('#retry-sync').hidden=false}catch{lock('Não foi possível carregar seus dados. Tente novamente.')}}else{lock(errorText(e));state('Não conectado ao banco')}}
}
$('#google-login').onclick=async()=>{message.textContent='Abrindo o Google…';try{await setPersistence(auth,browserLocalPersistence);await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){message.textContent=errorText(e)}};
$('#logout').onclick=async()=>{if(dirty||saving){alert('Há alterações ainda não sincronizadas. Exporte um backup ou aguarde antes de sair.');return}await signOut(auth)};
$('#retry-account').onclick=()=>connect(auth.currentUser);
$('#retry-sync').onclick=()=>{if(conflict){state('Resolva a diferença entre as versões primeiro.');return}if(dirty)flush();else connect(auth.currentUser)};
$('#resolve-conflict').onclick=async()=>{if(saving)return;try{const snap=await getDocFromServer(ref);if(!snap.exists())return;const data=decode(snap.data());if(dirty){bridge.export(dirty,'backup-alteracoes-locais');alert('Baixamos um backup das alterações locais. Agora carregaremos a versão da conta; você pode consultar ou importar o backup depois.')}revision=snap.data().revision;dirty=null;conflict=false;bridge.apply(data);remember(data,false);$('#resolve-conflict').hidden=true;$('#retry-sync').hidden=true;state('Versão da conta carregada.')}catch(e){state(errorText(e))}};
window.addEventListener('online',()=>{if(auth.currentUser&&!saving&&!conflict)connect(auth.currentUser)});
window.addEventListener('beforeunload',e=>{if(dirty||saving){e.preventDefault();e.returnValue=''}});
lock('Conectando à sua conta…');onAuthStateChanged(auth,connect);
