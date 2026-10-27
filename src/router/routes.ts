import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('@/pages/IndexPage.vue') },
      { path: '/login', component: () => import('@/pages/Auth/LoginPage.vue') },
      {
        path: 'proveedores',
        component: () => import('@/pages/ProveedoresPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'clientes',
        component: () => import('@/pages/ClientesPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'configuraciones',
        component: () => import('@/pages/ConfiguracionesPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'muebles',
        component: () => import('@/pages/MueblesPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'tipos-pago',
        component: () => import('@/pages/TiposPagoPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'usuarios',
        component: () => import('@/pages/UsersPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'insumos',
        component: () => import('@/pages/InsumosPage.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'pedidos',
        component: () => import('@/pages/PedidosPage.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/ErrorNotFound.vue')
  }
]

export default routes
