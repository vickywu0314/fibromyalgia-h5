<template>
<main>
  <section class="card patient-card"><div class="avatar">{{ avatar }}</div><div class="pbody"><div class="pname">{{ name }}</div><div class="pid">{{ code ? '研究编号 '+code : '研究编号待生成' }}</div></div><div class="history" @click="openFollowups">随访记录 ›</div></section>
  <section class="card progress-card"><div class="progress-top"><div class="progress-title">资料完成度</div><div class="progress-num">{{ completed }} / 7</div></div><div class="bar"><i :style="{width: progress+'%'}"></i></div></section>
  <div v-for="group in groups" :key="group.title" class="group"><div class="group-title">{{ group.title }}</div><div class="module-card">
    <button v-for="item in group.items" :key="item.name" class="module" @click="router.push(item.route)"><span class="state" :class="{done:item.done}">{{ item.done?'✓':'○' }}</span><span class="mbody"><span class="mname">{{ item.name }}</span><span class="mdesc">{{ item.desc }}</span></span><span class="chev">›</span></button>
  </div></div>
</main>
<div class="bottom"><button class="primary" @click="showToast('患者资料已保存')">完成本次资料录入</button></div><div v-if="toast" class="toast show">{{toast}}</div>
</template>
<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'; import { useRoute,useRouter } from 'vue-router'; import {initLeftTitle,registerNativeBack} from '../native/bridge'
const route=useRoute(),router=useRouter(),toast=ref(''); const name=computed(()=>route.query.name||'患者'),code=computed(()=>route.query.code||''); const avatar=computed(()=>String(name.value).slice(-1)); const completed=ref(1); const progress=computed(()=>completed.value/7*100)
const groups=[{title:'基础资料',items:[{name:'基本信息',desc:'姓名、身份证号及基础人口学信息',route:'/basic-info',done:true}]},{title:'临床资料',items:[{name:'病史病情',desc:'主诉、病程与既往病史',route:'/condition-history'},{name:'证候判断',desc:'临床症状与相关判断',route:'/syndrome-differentiation'},{name:'辅助检查',desc:'实验室、影像及其他检查',route:'/auxiliary-exam'},{name:'病情评估',desc:'量表与疾病状态评估',route:'/assessment'}]},{title:'治疗记录',items:[{name:'本次治疗方案',desc:'药物及其他治疗方案',route:'/treatment'},{name:'不良反应',desc:'治疗相关不良事件记录',route:'/adverse-reaction'}]}]
function openFollowups(){router.push({name:'followups',query:{name:name.value,id:route.query.id||''}})} function showToast(t){toast.value=t;setTimeout(()=>toast.value='',1500)} let cleanup; onMounted(()=>{initLeftTitle(2,'患者资料');cleanup=registerNativeBack(()=>router.back())});onUnmounted(()=>cleanup?.())
</script>
