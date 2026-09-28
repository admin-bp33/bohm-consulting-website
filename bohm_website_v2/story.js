/* A single measured path links the Ö bar, proof and commercial stations.
   Native scrolling is never intercepted. All copy exists without JavaScript. */
(() => {
  const main = document.querySelector('main');
  const svg = document.querySelector('.journey-line');
  const path = svg.querySelector('.journey-path');
  const svgNS = 'http://www.w3.org/2000/svg';
  const defs = document.createElementNS(svgNS,'defs');
  const sectionColors = document.createElementNS(svgNS,'linearGradient');
  sectionColors.id = 'journey-section-colors';
  sectionColors.setAttribute('gradientUnits','userSpaceOnUse');
  sectionColors.setAttribute('x1','0');
  sectionColors.setAttribute('x2','0');
  sectionColors.setAttribute('y1','0');
  defs.append(sectionColors);
  svg.prepend(defs);
  path.style.stroke = 'url(#journey-section-colors)';
  const mask = document.createElementNS(svgNS,'mask');
  mask.id = 'journey-quote-mask';
  mask.setAttribute('maskUnits','userSpaceOnUse');
  const visibleArea = document.createElementNS(svgNS,'rect');
  visibleArea.setAttribute('fill','white');
  const quoteCutout = document.createElementNS(svgNS,'rect');
  quoteCutout.setAttribute('fill','black');
  mask.append(visibleArea,quoteCutout);
  defs.append(mask);
  path.setAttribute('mask','url(#journey-quote-mask)');
  const branches = [-1,1].map(() => {
    const branch = document.createElementNS(svgNS,'path');
    branch.classList.add('journey-frame');
    svg.append(branch);
    return branch;
  });
  const bookingFork = document.createElementNS(svgNS,'path');
  bookingFork.classList.add('booking-fork');
  svg.append(bookingFork);
  const bookingLeft = bookingFork.cloneNode();
  svg.append(bookingLeft);
  let forkStart = 0, forkEnd = 0;
  let quoteBounds, pillarBounds, voiceNodes = [];
  const voices = [...document.querySelectorAll("#voci .quote")];
  const pillarItems = [...document.querySelectorAll('#pilastri .pillar')];
  const mapSymbols = [...document.querySelectorAll('.map-symbol')];
  const pillarThread = document.querySelector('.pillar-thread');
  const tip = svg.querySelector('.journey-tip');
  const hero = document.querySelector('#hero');
  const bar = document.querySelector('.o-bar');
  const proof = document.querySelector('#proof');
  const flow = document.querySelector('#flusso');
  const heading = flow.querySelector('h2');
  const words = [...heading.querySelectorAll('.flow-word')];
  const stations = [...flow.querySelectorAll('.flow-station')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('.motion-toggle');
  let samples = [], stationPositions = [], length = 0, drawn = 0;
  let mainTop = 0, startY = 0, titleTop = 0, titleHeight = 0;
  let frame = 0, resizeFrame = 0, ready = false;

  const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
  const point = (x,y) => ({x,y});
  function roundedPolyline(points, radius) {
    let result = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const a = points[i-1], b = points[i], c = points[i+1];
      const before = Math.hypot(b.x-a.x,b.y-a.y);
      const after = Math.hypot(c.x-b.x,c.y-b.y);
      if (!before || !after) continue;
      const r = Math.min(radius, before/2, after/2);
      const enter = point(b.x+(a.x-b.x)*r/before,b.y+(a.y-b.y)*r/before);
      const leave = point(b.x+(c.x-b.x)*r/after,b.y+(c.y-b.y)*r/after);
      result += ` L ${enter.x} ${enter.y} Q ${b.x} ${b.y} ${leave.x} ${leave.y}`;
    }
    const last = points[points.length-1];
    return result+` L ${last.x} ${last.y}`;
  }

  function rebuild() {
    resizeFrame = 0;
    const width = main.clientWidth;
    const mobile = width <= 560;
    const bounds = main.getBoundingClientRect();
    mainTop = bounds.top + scrollY;
    const local = element => {
      const r = element.getBoundingClientRect();
      return {x:r.left-bounds.left,y:r.top-bounds.top,width:r.width,height:r.height};
    };
    const b = local(bar), visual = local(document.querySelector('.hero-visual'));
    const p = local(proof), h = local(heading);
    const stroke = mobile ? 8 : Math.min(30,b.height*.7);
    const rail = width - (mobile ? 9 : 18);
    pillarThread.style.strokeWidth = String(stroke);
    pillarThread.setAttribute('vector-effect','non-scaling-stroke');
    const start = point(b.x+b.height/2,b.y+b.height/2);
    startY = start.y;
    const leftOfO = visual.x + (mobile ? -6 : -20);
    const belowO = visual.y + visual.height + (mobile ? 0 : 8);
    const proofX = width*(mobile ? .55 : .45);
    stationPositions = stations.map(station => {
      const n = local(station.querySelector('.station-node'));
      return point(n.x+n.width/2,n.y+n.height/2);
    });
    const first = stationPositions[0], last = stationPositions.at(-1);
    const stack = local(document.querySelector('.situation-stack'));
    const quote = local(document.querySelector('#riconosci .lead'));
    quoteBounds = quote;
    const center = width / 2;
    const thesisCards = [...document.querySelectorAll('.thesis-cards li')].map(local);
    const firstCard = thesisCards[0], finalCard = thesisCards.at(-1);
    const leftRail = mobile ? 9 : 18;
    const firstCenter = firstCard.x+firstCard.width/2;
    const pillarSection = local(document.querySelector('#pilastri'));
    const pillarStory = local(document.querySelector('.pillar-story'));
    const pillarMap = local(document.querySelector('.pillar-map'));
    const pillarX = width <= 760 ? pillarStory.x+8 : pillarMap.x+pillarMap.width/2;
    pillarBounds = pillarItems.map(local);
    const method = local(document.querySelector('#metodo'));
    const methodList = local(document.querySelector('#metodo .steps'));
    const portraits = [...document.querySelectorAll('#team .portrait')].map(local);
    const teamFirst = portraits[0], teamLast = portraits.at(-1);
    const teamRoute = width <= 760 ? [point(rail,teamFirst.y)] : [
      point(rail,teamFirst.y-56),point(teamFirst.x+teamFirst.width/2,teamFirst.y-56),
      point(teamFirst.x+teamFirst.width/2,teamFirst.y+teamFirst.height*.5),
      point(teamLast.x+teamLast.width/2,teamLast.y+teamLast.height*.5),
      point(rail,teamLast.y+teamLast.height*.5)
    ];
    voiceNodes = voices.map(voice => {
      const node = local(voice.querySelector('.quote-node'));
      return point(node.x+node.width/2,node.y+node.height/2);
    });
    const voiceList = local(document.querySelector('#voci .quotes'));
    const voiceRoute = [point(rail,voiceList.y-48),point(voiceNodes[0].x,voiceList.y-48),
      ...voiceNodes,point(voiceNodes[0].x,voiceList.y+voiceList.height+24),
      point(rail,voiceList.y+voiceList.height+24)];
    const methodX = width * (mobile ? .85 : .75);
    const cardRoute = mobile ? [
      point(leftRail,firstCard.y-28),
      point(firstCenter,firstCard.y-28),
      point(firstCenter,finalCard.y+finalCard.height-40),
      point(rail,finalCard.y+finalCard.height-40)
    ] : [
      point(leftRail,firstCard.y-28),point(firstCenter,firstCard.y-28),
      point(firstCenter,firstCard.y+firstCard.height*.45),
      point(finalCard.x+finalCard.width/2,firstCard.y+firstCard.height*.45),
      point(rail,firstCard.y+firstCard.height*.45)
    ];
    const choices = [...document.querySelectorAll('.booking-option')].map(local);
    const bookingGrid = local(document.querySelector('.booking-options'));
    const splitY = bookingGrid.y-56;
    const choiceX = choices[0].x+choices[0].width/2;
    forkStart = splitY; forkEnd = choices[1].y+24;
    const forkPoints = width <= 760 ? [point(choiceX,splitY),point(leftRail,splitY),point(leftRail,choices[1].y-20),point(choices[1].x+choices[1].width/2,choices[1].y-20),point(choices[1].x+choices[1].width/2,forkEnd)] : [point(center,splitY),point(choices[1].x+choices[1].width/2,splitY),point(choices[1].x+choices[1].width/2,forkEnd)];
    bookingFork.setAttribute('d',roundedPolyline(forkPoints,32));
    bookingFork.setAttribute('stroke-width',stroke);
    bookingLeft.setAttribute('d',roundedPolyline([point(center,splitY),point(choiceX,splitY),point(choiceX,choices[0].y+24)],32));
    bookingLeft.setAttribute('stroke-width',stroke);
    const points = [start,
      point(leftOfO,start.y), point(leftOfO,belowO),
      point(rail,belowO), point(rail,p.y+48),
      point(proofX,p.y+48), point(proofX,p.y+p.height-54),
      point(rail,p.y+p.height-54), point(rail,first.y-88),
      point(first.x,first.y-88), ...stationPositions,
      point(last.x,last.y+110), point(rail,last.y+110),
      point(rail,stack.y-65), point(center,stack.y-65),
      point(center,quote.y+quote.height+48),
      point(leftRail,quote.y+quote.height+48), ...cardRoute,
      point(rail,pillarStory.y-64),point(pillarX,pillarStory.y-64),
      point(pillarX,pillarStory.y+pillarStory.height+72),
      point(rail,pillarStory.y+pillarStory.height+72),
      point(rail,method.y+32),point(methodX,method.y+32),
      point(methodX,methodList.y+methodList.height+32),
      point(rail,methodList.y+methodList.height+32),
      ...teamRoute, ...voiceRoute,
      point(rail,splitY-64),point(center,splitY-64),point(center,splitY)
    ];
    svg.setAttribute('viewBox',`0 0 ${width} ${main.offsetHeight}`);
    svg.setAttribute('height',main.offsetHeight);
    // Paired stops create exact color cuts at section edges, without blending.
    // The same animated path stays cyan on paper/ink and white on cyan.
    const fullHeight = main.offsetHeight;
    const cyan = getComputedStyle(main).getPropertyValue('--cyan').trim();
    sectionColors.setAttribute('y2',fullHeight);
    sectionColors.replaceChildren();
    const addColor = (y,color) => {
      const stop = document.createElementNS(svgNS,'stop');
      stop.setAttribute('offset',clamp(y/fullHeight));
      stop.setAttribute('stop-color',color);
      sectionColors.append(stop);
    };
    addColor(0,cyan);
    main.querySelectorAll(':scope > section.cyan').forEach(section => {
      const area = local(section);
      addColor(area.y,cyan);
      addColor(area.y,'#ffffff');
      addColor(area.y+area.height,'#ffffff');
      addColor(area.y+area.height,cyan);
    });
    addColor(fullHeight,cyan);
    visibleArea.setAttribute('width',width);
    visibleArea.setAttribute('height',fullHeight);
    mask.setAttribute('x',0); mask.setAttribute('y',0);
    mask.setAttribute('width',width); mask.setAttribute('height',fullHeight);
    quoteCutout.setAttribute('x',quote.x-2);
    quoteCutout.setAttribute('y',quote.y);
    quoteCutout.setAttribute('width',quote.width+4);
    quoteCutout.setAttribute('height',quote.height);
    branches.forEach((branch,index) => {
      const edge = index === 0 ? quote.x : quote.x+quote.width;
      branch.setAttribute('d',roundedPolyline([
        point(center,quote.y),point(edge,quote.y),
        point(edge,quote.y+quote.height),point(center,quote.y+quote.height)
      ],mobile ? 20 : 32));
      branch.setAttribute('stroke-width',mobile ? 5 : 8);
      const total=branch.getTotalLength();
      branch.style.strokeDasharray=`${total} ${total}`;
    });
    path.setAttribute('d',roundedPolyline(points,mobile ? 22 : 52));
    path.setAttribute('stroke-width',stroke);
    length = path.getTotalLength();
    path.style.strokeDasharray = `${length} ${length}`;
    samples = [];
    const count = Math.ceil(length/8);
    for (let i=0;i<=count;i++) {
      const distance = length*i/count;
      samples.push({distance,y:path.getPointAtLength(distance).y});
    }
    titleTop = h.y + mainTop;
    titleHeight = h.height;
    ready = true;
    document.documentElement.classList.add('motion-ready');
    drawn = targetLength();
    render();
  }

  function distanceAtY(y) {
    let lo=0,hi=samples.length-1;
    while(lo<hi) { const mid=Math.ceil((lo+hi)/2); if(samples[mid].y<=y)lo=mid;else hi=mid-1; }
    return samples[lo]?.distance || 0;
  }
  function targetLength() {
    if (reduce.matches) return length;
    // Emerge from the existing bar only after the user starts scrolling.
    const emergence = clamp((scrollY-12)/180);
    const horizon = scrollY + innerHeight*.76 - mainTop;
    const y = startY + (horizon-startY)*emergence;
    return scrollY <= 12 ? 0 : distanceAtY(y);
  }
  function render() {
    frame = 0;
    if (!ready) return;
    const target = targetLength();
    drawn = reduce.matches ? length : drawn+(target-drawn)*.24;
    if(Math.abs(target-drawn)<.5) drawn=target;
    path.style.strokeDashoffset = String(length-drawn);
    path.style.visibility = drawn < 1 ? 'hidden' : 'visible';
    const end = path.getPointAtLength(drawn);
    [bookingFork,bookingLeft].forEach(branch => {
    const forkLength = branch.getTotalLength();
    const forkProgress = reduce.matches ? 1 : clamp((scrollY+innerHeight*.76-mainTop-forkStart)/(forkEnd-forkStart));
    branch.style.strokeDasharray = String(forkLength);
    branch.style.strokeDashoffset = String(forkLength*(1-forkProgress));
    branch.style.visibility = forkProgress > 0 ? 'visible' : 'hidden';
    });
    voices.forEach((voice,index) => voice.classList.toggle("is-reached",reduce.matches || end.y >= voiceNodes[index].y));
    branches.forEach(branch => {
      const total=branch.getTotalLength();
      const progress=reduce.matches ? 1 : clamp((end.y-quoteBounds.y)/quoteBounds.height);
      branch.style.strokeDashoffset=String(total*(1-progress));
      branch.style.visibility=progress > 0 ? 'visible' : 'hidden';
    });
    tip.setAttribute('cx',end.x); tip.setAttribute('cy',end.y);
    tip.setAttribute('r','0'); // The rounded path cap is the only moving endpoint.
    document.querySelector('.site-header').classList.toggle('scrolled',scrollY>12);
    stations.forEach((station,index) => {
      if (reduce.matches || end.y >= stationPositions[index].y-8) station.classList.add('is-reached');
    });
    const pillarHorizon = scrollY + innerHeight*.65 - mainTop;
    let builtProgress = 0;
    pillarItems.forEach((item,index) => {
      const area = pillarBounds[index];
      const reached = reduce.matches || pillarHorizon >= area.y+area.height*.25;
      item.classList.toggle('is-built',reached);
      mapSymbols[index].classList.toggle('is-built',reached);
      builtProgress += clamp((pillarHorizon-area.y)/area.height);
    });
    pillarThread.style.strokeDasharray = '560';
    pillarThread.style.strokeDashoffset = String(reduce.matches ? 0 : 560*(1-builtProgress/3));
    const headingProgress = clamp((scrollY+innerHeight*.88-titleTop)/(titleHeight+innerHeight*.24));
    words.forEach((word,index) => {
      const opacity = reduce.matches ? 1 : .14+.86*clamp(headingProgress*words.length-index);
      word.style.setProperty('--word-opacity',String(opacity));
    });
    if(drawn!==target) frame=requestAnimationFrame(render);
  }
  const schedule = () => { if(!frame) frame=requestAnimationFrame(render); };
  const scheduleResize = () => { if(!resizeFrame) resizeFrame=requestAnimationFrame(rebuild); };
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',scheduleResize,{passive:true});
  reduce.addEventListener('change',() => { rebuild(); });
  document.fonts.ready.then(rebuild);
  window.addEventListener('load',scheduleResize,{once:true});

  toggle.addEventListener('click',() => {
    const paused=toggle.getAttribute('aria-pressed')!=='true';
    toggle.setAttribute('aria-pressed',String(paused));
    toggle.setAttribute('aria-label',paused?'Riprendi i caroselli':'Metti in pausa i caroselli');
    toggle.querySelector('span').textContent=paused?'Riprendi':'Pausa';
    proof.classList.toggle('is-paused',paused);
  });
  // Off-screen belts do not consume animation frames.
  new IntersectionObserver(([entry]) => {
    proof.classList.toggle('is-offscreen',!entry.isIntersecting);
  },{rootMargin:'100px'}).observe(proof);
})();
