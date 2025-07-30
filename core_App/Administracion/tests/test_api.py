from django.test import TestCase
from rest_framework.test import APIClient
from Proveedores.models import Proveedor
import os

class AdministracionAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Ensure admin credentials exist
        self.username = os.environ.get('ADMIN_USERNAME', 'admin')
        self.password = os.environ.get('ADMIN_PASSWORD', 'change_me')
        # Minimal proveedor instance for testing
        self.proveedor = Proveedor.objects.create(
            cod_cpa01='PRV001',
            nom_provee='Proveedor Uno',
            n_cuit='20111111112'
        )

    def auth_params(self, extra=None):
        params = {'username': self.username, 'password': self.password}
        if extra:
            params.update(extra)
        return params

    def test_auth_required(self):
        resp = self.client.get('/administracion/api/proveedores/')
        self.assertEqual(resp.status_code, 401)

    def test_list_proveedores(self):
        resp = self.client.get('/administracion/api/proveedores/', self.auth_params())
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['count'], 1)

    def test_retrieve_proveedor(self):
        resp = self.client.get(f'/administracion/api/proveedores/{self.proveedor.id}/', self.auth_params())
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()['id'], self.proveedor.id)

    def test_proveedor_search(self):
        resp = self.client.post('/administracion/api/proveedor-search/', self.auth_params({'query': 'Proveedor'}))
        self.assertEqual(resp.status_code, 200)
        results = resp.json()
        self.assertTrue(any(r['id'] == self.proveedor.id for r in results))
