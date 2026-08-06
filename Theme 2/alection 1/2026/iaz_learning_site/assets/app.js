
(() => {
  const sections = window.IAZ_SECTIONS || [];
  const quizData = window.IAZ_QUIZ || [];
  const pages = [...document.querySelectorAll('[data-page]')];
  const links = [...document.querySelectorAll('[data-route]')];
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const crumb = document.getElementById('currentCrumb');
  const sidebar = document.getElementById('sidebar');
  const storageKey = 'iaz-data-lesson-progress-v1';
  let state = JSON.parse(localStorage.getItem(storageKey) || '{"completed":[],"quizBest":0,"activities":[]}');
  const allTrackable = [...sections.map(s=>s.id), 'workshop', 'quiz'];

  function save(){ localStorage.setItem(storageKey, JSON.stringify(state)); updateProgress(); }
  function toast(msg){ const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(window._toast); window._toast=setTimeout(()=>el.classList.remove('show'),2200); }
  function titleFor(route){ if(route==='overview')return 'Огляд заняття'; if(route==='workshop')return 'Інтерактивний практикум'; if(route==='quiz')return 'Підсумковий тест'; return sections.find(s=>s.id===route)?.title || route; }
  function routeTo(route, push=true){
    if(!document.querySelector(`[data-page="${CSS.escape(route)}"]`)) route='overview';
    pages.forEach(p=>{ const active=p.dataset.page===route; p.hidden=!active; p.classList.toggle('active',active); });
    navLinks.forEach(l=>l.classList.toggle('active',l.dataset.route===route));
    crumb.textContent=titleFor(route);
    document.title=`${titleFor(route)} — ІАЗ ОУВ`;
    if(push) history.replaceState(null,'',`#${route}`);
    window.scrollTo({top:0,behavior:'smooth'});
    sidebar.classList.remove('open');
    updatePager(route);
  }
  links.forEach(l=>l.addEventListener('click',()=>routeTo(l.dataset.route)));
  document.getElementById('menuToggle').addEventListener('click',()=>sidebar.classList.toggle('open'));

  function updateProgress(){
    const completed=new Set(state.completed);
    document.querySelectorAll('[data-complete]').forEach(b=>{ const done=completed.has(b.dataset.complete); b.classList.toggle('completed',done); b.innerHTML=done?'<span>✓</span> Завершено':'<span>✓</span> Позначити завершеним'; });
    navLinks.forEach(l=>l.classList.toggle('completed',completed.has(l.dataset.route)));
    const pct=Math.round((allTrackable.filter(x=>completed.has(x)).length/allTrackable.length)*100);
    document.getElementById('progressText').textContent=pct+'%';
    document.getElementById('progressBar').style.width=pct+'%';
  }
  document.querySelectorAll('[data-complete]').forEach(b=>b.addEventListener('click',()=>{
    const id=b.dataset.complete; state.completed=state.completed.includes(id)?state.completed.filter(x=>x!==id):[...state.completed,id]; save(); toast(state.completed.includes(id)?'Модуль завершено':'Позначку знято');
  }));
  document.getElementById('resetProgress').addEventListener('click',()=>{ if(confirm('Скинути весь навчальний прогрес?')){state={completed:[],quizBest:0,activities:[]};save();toast('Прогрес скинуто');} });

  function updatePager(route){
    const idx=sections.findIndex(s=>s.id===route); const page=document.querySelector(`[data-page="${CSS.escape(route)}"]`); if(!page||idx<0)return;
    const prev=page.querySelector('.prev'),next=page.querySelector('.next');
    if(prev){prev.disabled=idx===0;prev.onclick=()=>idx>0&&routeTo(sections[idx-1].id)}
    if(next){next.textContent=idx===sections.length-1?'Перейти до тесту →':'Наступний модуль →';next.onclick=()=>routeTo(idx===sections.length-1?'quiz':sections[idx+1].id)}
  }

  // Theme and font controls
  const theme=localStorage.getItem('iaz-theme'); if(theme==='dark')document.body.classList.add('dark');
  document.getElementById('themeToggle').addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem('iaz-theme',document.body.classList.contains('dark')?'dark':'light')});
  let fs=Number(localStorage.getItem('iaz-font')||1);
  document.documentElement.style.setProperty('--font-scale',fs);
  document.getElementById('fontToggle').addEventListener('click',()=>{fs=fs>=1.15?.92:Math.round((fs+.08)*100)/100;document.documentElement.style.setProperty('--font-scale',fs);localStorage.setItem('iaz-font',fs)});

  // Search
  const searchInput=document.getElementById('searchInput'),searchResults=document.getElementById('searchResults');
  const searchable=sections.map(s=>{const page=document.querySelector(`[data-page="${CSS.escape(s.id)}"]`);return {...s,text:(page?.innerText||'').replace(/\s+/g,' ')};});
  searchInput.addEventListener('input',()=>{
    const q=searchInput.value.trim().toLocaleLowerCase('uk'); if(q.length<2){searchResults.hidden=true;return}
    const results=searchable.filter(x=>x.text.toLocaleLowerCase('uk').includes(q)).slice(0,8);
    searchResults.innerHTML=results.length?results.map(r=>{const low=r.text.toLocaleLowerCase('uk'),i=low.indexOf(q),snippet=r.text.slice(Math.max(0,i-45),i+100);return `<button class="search-result" data-result="${r.id}"><b>${r.title}</b><small>…${snippet}…</small></button>`}).join(''):'<div class="search-result">Нічого не знайдено</div>';
    searchResults.hidden=false;
    searchResults.querySelectorAll('[data-result]').forEach(b=>b.onclick=()=>{routeTo(b.dataset.result);searchResults.hidden=true;searchInput.value=''});
  });
  document.addEventListener('click',e=>{if(!e.target.closest('.sidebar-search'))searchResults.hidden=true});

  // Quality calculator
  const val=id=>Math.max(0,Number(document.getElementById(id).value)||0);
  document.getElementById('calcQuality').addEventListener('click',()=>{
    const metrics=[
      ['Повнота',val('qFilled')/Math.max(1,val('qTotal')),0.25],['Валідність',val('qValid')/Math.max(1,val('qChecked')),0.25],
      ['Своєчасність',val('qTimely')/Math.max(1,val('qReceived')),0.30],['Унікальність',val('qUnique')/Math.max(1,val('qRecords')),0.20]
    ].map(m=>[m[0],Math.min(1,m[1]),m[2]]);
    const q=metrics.reduce((a,m)=>a+m[1]*m[2],0); const pct=Math.round(q*100);
    document.getElementById('qualityScore').textContent=pct+'%';document.getElementById('qualityRing').style.background=`conic-gradient(var(--olive) ${pct*3.6}deg,#d8ddcf 0deg)`;
    document.getElementById('qualityBars').innerHTML=metrics.map(m=>`<div class="metric"><div><span>${m[0]}</span><b>${Math.round(m[1]*100)}%</b></div><i><b style="width:${m[1]*100}%"></b></i></div>`).join('');
    if(!state.activities.includes('quality'))state.activities.push('quality'); save();
  });

  // ETL sequence
  const etlCorrect=['extract','transform','load'];let etl=[];const names={extract:'Вилучення',transform:'Перетворення',load:'Завантаження'};
  document.querySelectorAll('#etlChoices button').forEach(b=>b.addEventListener('click',()=>{etl.push(b.dataset.step);b.disabled=true;renderETL()}));
  function renderETL(){document.querySelectorAll('#etlSequence span').forEach((s,i)=>{s.textContent=etl[i]?names[etl[i]]:i+1;s.classList.toggle('filled',!!etl[i])});if(etl.length===3){const ok=etl.every((x,i)=>x===etlCorrect[i]);const f=document.getElementById('etlFeedback');f.textContent=ok?'Правильно: Extract → Transform → Load.':'Послідовність неправильна. Спочатку дані вилучають, потім перетворюють і лише після цього завантажують.';f.className='feedback '+(ok?'good':'bad');if(ok&&!state.activities.includes('etl')){state.activities.push('etl');save()}}}
  document.getElementById('etlReset').addEventListener('click',()=>{etl=[];document.querySelectorAll('#etlChoices button').forEach(b=>b.disabled=false);document.getElementById('etlFeedback').textContent='';renderETL()});

  // Storage advisor
  const advice={
    events:['Реляційна база даних','PostgreSQL або інша реляційна СКБД забезпечить таблиці, зв’язки, обмеження цілісності, транзакції та складні запити.'],
    geo:['Геопросторова база даних','PostgreSQL + PostGIS доцільні для точок, маршрутів, районів, відстаней, перетинів і просторової фільтрації.'],
    media:['Файлове або об’єктне сховище','Великі файли зберігайте окремо, а їх метадані, права та посилання — у базі даних.'],
    telemetry:['База часових рядів','Оптимізована для значень із часовими мітками, агрегації за інтервалами, трендів і виявлення аномалій.'],
    relations:['Графова база даних','Зручна для мереж зв’язків, залежностей між подіями, об’єктами, документами та інформаційними потоками.'],
    raw:['Озеро даних або Lakehouse','Дозволяє зберігати великі первинні структуровані, напівструктуровані й неструктуровані набори з каталогізацією та версіями.']
  };
  document.getElementById('recommendStorage').addEventListener('click',()=>{let [title,text]=advice[document.getElementById('dataType').value];const need=document.getElementById('dataNeed').value;if(need==='analytics'&&document.getElementById('dataType').value==='events'){title='Сховище даних';text='Для історичної звітності інтегруйте оперативну реляційну базу зі сховищем даних та тематичними вітринами.'} if(need==='flexibility'&&document.getElementById('dataType').value==='events'){title='Документоорієнтована база';text='Коли структура подій часто змінюється, JSON-документи дають гнучкість, але потребують додаткового контролю схем і дублювання.'} document.getElementById('storageResult').innerHTML=`<strong>${title}</strong><br>${text}`;if(!state.activities.includes('storage'))state.activities.push('storage');save()});

  // Duplicate scenario
  document.getElementById('checkDuplicate').addEventListener('click',()=>{const v=document.querySelector('input[name="duplicate"]:checked')?.value;const f=document.getElementById('duplicateFeedback');if(!v){f.textContent='Спочатку оберіть варіант.';f.className='feedback bad';return}const ok=v==='link';f.textContent=ok?'Правильно. Первинні повідомлення зберігаються для простежуваності, а підтверджена подія створюється окремо й пов’язується з усіма джерелами.':'Неправильно. Видалення або перезапис знищить походження, історію та можливість повторної перевірки.';f.className='feedback '+(ok?'good':'bad');if(ok&&!state.activities.includes('duplicate')){state.activities.push('duplicate');state.completed=[...new Set([...state.completed,'workshop'])];save()}});

  // Quiz
  let qi=0, answers=Array(quizData.length).fill(null), locked=false;
  const qc=document.getElementById('quizContainer'),qr=document.getElementById('quizResult');
  function renderQuiz(){
    if(qi>=quizData.length){finishQuiz();return}
    locked=false; const q=quizData[qi]; document.getElementById('quizPosition').textContent=`Запитання ${qi+1} з ${quizData.length}`;document.getElementById('quizScoreLive').textContent=`${answers.filter((a,i)=>a===quizData[i].answer).length} правильних`;document.getElementById('quizProgress').style.width=`${qi/quizData.length*100}%`;
    qc.innerHTML=`<div class="quiz-question"><span class="eyebrow">Запитання ${qi+1}</span><h2>${q.q}</h2><div class="quiz-options">${q.options.map((o,i)=>`<button class="quiz-option" data-answer="${i}"><b>${String.fromCharCode(65+i)}</b><span>${o}</span></button>`).join('')}</div><div id="quizExplanation"></div><div class="quiz-actions"><button class="text-button" id="quizRestart">Почати тест знову</button><button class="primary-btn" id="quizNext" disabled>${qi===quizData.length-1?'Завершити':'Наступне запитання'}</button></div></div>`;
    qc.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{if(locked)return;locked=true;const a=Number(b.dataset.answer);answers[qi]=a;qc.querySelectorAll('[data-answer]').forEach((x,i)=>{x.disabled=true;if(i===q.answer)x.classList.add('selected');if(i===a&&a!==q.answer)x.style.borderColor='var(--bad)'});document.getElementById('quizExplanation').innerHTML=`<div class="quiz-explanation"><strong>${a===q.answer?'Правильно.':'Неправильно.'}</strong> ${q.explain}</div>`;document.getElementById('quizNext').disabled=false;document.getElementById('quizScoreLive').textContent=`${answers.filter((a,i)=>a===quizData[i].answer).length} правильних`;});
    document.getElementById('quizNext').onclick=()=>{qi++;renderQuiz()};document.getElementById('quizRestart').onclick=restartQuiz;
  }
  function restartQuiz(){qi=0;answers.fill(null);qr.hidden=true;qc.hidden=false;renderQuiz()}
  function finishQuiz(){const score=answers.filter((a,i)=>a===quizData[i].answer).length,pct=Math.round(score/quizData.length*100),passed=pct>=75;state.quizBest=Math.max(state.quizBest||0,pct);if(passed)state.completed=[...new Set([...state.completed,'quiz'])];save();document.getElementById('quizProgress').style.width='100%';qc.hidden=true;qr.hidden=false;qr.innerHTML=`<span class="eyebrow">Результат</span><div class="result-number">${pct}%</div><h2>${passed?'Завдання виконано успішно':'Варто повторити матеріал'}</h2><p>${score} правильних відповідей із ${quizData.length}. Найкращий результат: ${state.quizBest}%.</p><button class="primary-btn" id="again">Пройти ще раз</button> <button class="secondary-btn" style="color:var(--olive);border-color:var(--olive)" data-route="overview">Повернутися до огляду</button>`;document.getElementById('again').onclick=restartQuiz;qr.querySelector('[data-route]').onclick=()=>routeTo('overview')}
  renderQuiz();

  updateProgress();routeTo(location.hash.slice(1)||'overview',false);
})();
