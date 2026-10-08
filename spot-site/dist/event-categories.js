export function matchesCategory(event, category) {
  if(category==='Tutti')return true;
  if(category==='LGBT+')return event.is_lgbt===true;
  const aliases={'DJ SET':['DJ SET','Party'],'Live/Mostre Art':['Live/Mostre Art','Concerti','Mostre']};
  return (aliases[category]||[category]).includes(event.category);
}
