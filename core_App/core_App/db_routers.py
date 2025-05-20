class DatabaseRouter:
    """
    Rutea modelos específicos a la base de datos correspondiente.
    Por ejemplo, puedes enviar modelos de la app 'Proveedores' a SQL Server.
    """

    route_app_labels = {'consultasTango'}

    def db_for_read(self, model, **hints):
        if model._meta.app_label in self.route_app_labels:
            return 'sqlserver'
        return 'default'

    def db_for_write(self, model, **hints):
        if model._meta.app_label in self.route_app_labels:
            return 'sqlserver'
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        db_list = ('default', 'sqlserver')
        if obj1._state.db in db_list and obj2._state.db in db_list:
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label in self.route_app_labels:
            return db == 'sqlserver'
        return db == 'default'
