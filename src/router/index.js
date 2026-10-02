import { createRouter, createWebHashHistory } from 'vue-router'
import PatientList from '../views/PatientList.vue'
import PatientAdd from '../views/PatientAdd.vue'
import PatientDetail from '../views/PatientDetail.vue'
import FollowUpList from '../views/FollowUpList.vue'
import ResearchPlatform from '../views/ResearchPlatform.vue'
import MigrationPending from '../views/system/MigrationPending.vue'
import { staticPages } from '../config/staticPages'

const migratedSources = new Set(['patient-list.html','patient-add.html','patient-detail.html','follow-up-list.html','research-platform.html'])
const routeOverrides = {
  'fibromyalgia-basic-info/basic-info.html':'/basic-info',
  'fibromyalgia-condition-history/condition-history.html':'/condition-history',
  'fibromyalgia-syndrome-differentiation/syndrome-differentiation.html':'/syndrome-differentiation',
  'fibromyalgia-auxiliary-exam/auxiliary-exam.html':'/auxiliary-exam',
  'bingqing-pinggu/index.html':'/assessment',
  'zhiliao-fangan/index.html':'/treatment',
  'fibromyalgia-adverse-reaction/adverse-reaction.html':'/adverse-reaction'
}
const pendingRoutes = staticPages.filter(p=>!migratedSources.has(p.source)).map(page=>({path:routeOverrides[page.source]||page.route,component:MigrationPending,meta:{source:page.source,title:page.title}}))

export default createRouter({history:createWebHashHistory(),routes:[
  {path:'/',redirect:'/patients'},
  {path:'/research-platform',name:'research-platform',component:ResearchPlatform},
  {path:'/patients',name:'patients',component:PatientList},
  {path:'/patients/add',name:'patient-add',component:PatientAdd},
  {path:'/patients/detail',name:'patient-detail',component:PatientDetail},
  {path:'/followups',name:'followups',component:FollowUpList},
  ...pendingRoutes,
  {path:'/:pathMatch(.*)*',redirect:'/patients'}
]})
