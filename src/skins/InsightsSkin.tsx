import { useMemo, useState } from "react";
import { BarChart3, RotateCcw, Eye, Heart, Bookmark, Clock3, Sparkles } from "lucide-react";
import type { Props } from "./shared";
import { Header } from "./shared";
import { readStudyEvents, resetStudyEvents } from "./study";

const names: Record<string,string> = {
  redbook:"小红书", wechat:"微信", weibo:"微博", twitter:"X"
};
const labels: Record<string,string> = {
  "学业":"学业","职业":"职业","财富":"财富","恋爱":"恋爱","婚姻":"婚姻","生育":"生育",
  "外貌":"外貌","身材":"身材","旅行":"旅行","生活方式":"生活方式","挫折":"挫折","普通日常":"普通日常",
  "成功":"成功","压力":"压力","消费":"消费"
};
export function InsightsSkin(p: Props) {
  const [version,setVersion] = useState(0);
  const [revealed,setRevealed] = useState(false);
  const events = useMemo(() => readStudyEvents(), [version]);
  const count = (type:string) => events.filter(e=>e.type===type).length;
  const tagStats = useMemo(() => {
    const map = new Map<string,{views:number;likes:number;saves:number;dwell:number;comments:number;chats:number;hot:number}>();
    const ensure=(tag:string)=>{if(!map.has(tag)) map.set(tag,{views:0,likes:0,saves:0,dwell:0,comments:0,chats:0,hot:0}); return map.get(tag)!;};
    for(const e of events) for(const tag of e.tags||[]) {
      const v=ensure(tag);
      if(e.type==="item_view") v.views++;
      if(e.type==="like") v.likes++;
      if(e.type==="save") v.saves++;
      if(e.type==="item_dwell") v.dwell+=e.durationMs||0;
      if(e.type==="comments_open") v.comments++;
      if(e.type==="chat_open") v.chats++;
      if(e.type==="topic_open") v.hot++;
    }
    return [...map.entries()].sort((a,b)=>b[1].views-a[1].views);
  },[events]);
  const totalDwell = events.filter(e=>e.type==="item_dwell").reduce((s,e)=>s+(e.durationMs||0),0);
  const top=(key:"views"|"likes"|"saves"|"dwell")=>[...tagStats].sort((a,b)=>b[1][key]-a[1][key])[0]?.[0]||"暂无记录";
  const max=Math.max(1,...tagStats.map(([,v])=>v.views));
  const apps=[...new Set(events.map(e=>e.appId))].filter(a=>names[a]);
  return <div className="catalog-skin insights-ui">
    <Header p={p}><button className="insights-reset" onClick={()=>{resetStudyEvents();setVersion(v=>v+1);setRevealed(false);}}><RotateCcw size={15}/> 重置记录</button></Header>
    <div className="catalog-scroll insights-scroll">
      <div className="insights-hero"><span>YOUR EXPLORATION</span><h1>你的浏览画像</h1><p>这是一份基于本次体验操作生成的内容关注记录，不代表心理测量或人格判断。</p></div>
      <div className="insights-stats">
        <div><Eye/><strong>{count("item_view")}</strong><small>浏览内容</small></div>
        <div><Heart/><strong>{count("like")}</strong><small>点赞次数</small></div>
        <div><Bookmark/><strong>{count("save")}</strong><small>收藏次数</small></div>
        <div><Clock3/><strong>{Math.round(totalDwell/60000)} 分</strong><small>内容停留</small></div>
      </div>
      <section className="insights-section"><h2>不同内容类型的浏览偏好</h2>
        {tagStats.length?tagStats.map(([tag,v])=><div className="insights-bar" key={tag}><div><span>{labels[tag]||tag}</span><small>{v.views} 次浏览</small></div><i><b style={{width:(v.views/max*100)+"%"}}/></i></div>):<p className="insights-empty">开始浏览社交平台后，这里会逐步生成你的内容关注分布。</p>}
      </section>
      <section className="insights-section"><h2>互动行为画像</h2><div className="insights-highlights">
        <div><small>浏览最多</small><strong>{top("views")}</strong></div>
        <div><small>点赞最多</small><strong>{top("likes")}</strong></div>
        <div><small>收藏最多</small><strong>{top("saves")}</strong></div>
        <div><small>停留最长</small><strong>{top("dwell")}</strong></div>
      </div></section>
      <section className="insights-section"><h2>平台探索情况</h2><div className="insights-platforms">{apps.map(app=><span key={app}>{names[app]} · {events.filter(e=>e.appId===app&&e.type==="app_open").length} 次进入</span>)}</div><p className="insights-note">记录仅保存在当前浏览器本地。关闭页面或更换设备不会自动同步。</p></section>
      <button className="insights-reveal" onClick={()=>setRevealed(v=>!v)}><Sparkles size={17}/> {revealed?"收起主题揭示":"查看主题揭示"}</button>
      {revealed&&<section className="insights-reveal-copy"><h2>屏幕里的生活</h2><p>你刚刚浏览了许多人的人生片段。有人保研、有人失业，有人恋爱、有人分手，有人结婚生子，有人环球旅行，也有人正在为明天的生活发愁。</p><p>当这些不同的人生被同时放进同一块屏幕，我们是否也在不知不觉中，用别人的生活衡量自己？</p></section>}
      <p className="insights-footer">虚构模拟社交内容 · 课堂互动体验</p>
    </div>
  </div>;
}
