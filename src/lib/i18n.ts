// Static bilingual UI dictionary. User-entered content is NOT translated.
// Stored in a cookie ('locale') so server components can read it.

export type Locale = 'es' | 'en';
export const LOCALES: Locale[] = ['es', 'en'];
export const DEFAULT_LOCALE: Locale = 'es';
export const LOCALE_COOKIE = 'locale';

export const dict = {
  es: {
    siteName: 'Venezuela Responde',
    tagline: 'Información verificada de ayuda tras los terremotos del 24 de junio.',

    nav: {
      home: 'Inicio',
      help: 'Necesito ayuda',
      donate: 'Quiero ayudar',
      verified: 'Información verificada',
      resources: 'Recursos',
      admin: 'Equipo',
    },

    home: {
      pathA: 'Necesito ayuda',
      pathADesc: 'Familia perdida, refugios, números de emergencia, ayuda consular.',
      pathB: 'Quiero ayudar',
      pathBDesc: 'Canales verificados de donación, centros de acopio, voluntariado.',
      pathC: 'Cómo verificamos / Evita estafas',
      lastUpdated: 'Última actualización',
      stats: {
        centers: 'centros verificados',
        missing: 'personas reportadas',
        channels: 'canales de donación',
      },
    },

    badges: {
      verified: 'Verificado',
      reported: 'Reportado',
      legendTitle: 'Nuestro estándar',
      legendVerified: 'Verificado: contacto directo o organización establecida en el país.',
      legendReported: 'Reportado: información creíble, de segunda mano. No publicamos lo no confirmado.',
    },

    centers: {
      title: 'Centros de Acopio',
      filterState: 'Estado',
      filterAll: 'Todos',
      filterDirection: 'Tipo',
      directionDropoff: 'Llevar donaciones',
      directionPickup: 'Recibir ayuda',
      search: 'Buscar por nombre, ciudad...',
      empty: 'No hay centros en esta selección.',
      acceptedItems: 'Aceptan',
      urgentNeeds: 'Necesidad urgente',
      hours: 'Horario',
      contact: 'Contacto',
    },

    missing: {
      title: 'Personas Desaparecidas',
      search: 'Buscar por nombre',
      lastSeen: 'Visto por última vez',
      contactReporter: 'Contactar a quien reportó',
      foundSafe: 'ENCONTRADO',
      empty: 'No hay personas reportadas en esta selección.',
      report: 'Reportar una desaparición',
      reportNote: 'Envíanos un mensaje y un miembro del equipo se comunicará contigo. No publicamos sin consentimiento.',
    },

    donate: {
      title: 'Cómo ayudar',
      moneyTitle: 'Canales verificados',
      remittanceTitle: 'Enviar dinero directo a familia',
      inKindTitle: 'Donaciones en especie',
      skillsTitle: 'Voluntariado profesional',
      whyTrusted: 'Por qué confiamos',
    },

    resources: {
      title: 'Recursos y números útiles',
      emergency: 'Emergencias',
      official: 'Canales oficiales',
      consular: 'Ayuda consular',
      antiScam: 'Evita estafas',
      shelters: 'Refugios oficiales',
    },

    admin: {
      login: 'Iniciar sesión',
      email: 'Correo',
      password: 'Contraseña',
      signOut: 'Cerrar sesión',
      dashboard: 'Panel',
      pending: 'Cola pendiente',
      addCenter: '+ Centro',
      addMissing: '+ Desaparecido',
      manageCenters: 'Centros',
      manageMissing: 'Desaparecidos',
      manageChannels: 'Donaciones',
      manageResources: 'Recursos',
      team: 'Equipo',
      saveDraft: 'Guardar borrador',
      savePublish: 'Guardar y publicar',
      publish: 'Publicar',
      unpublish: 'Despublicar',
      delete: 'Eliminar',
      addedBy: 'Añadido por',
      publishedBy: 'Publicado por',
      role: 'Rol',
      roleEditor: 'Editor',
      roleAdmin: 'Admin',
      trustTier: 'Nivel de verificación',
      direction: 'Tipo de centro',
    },

    common: {
      yes: 'Sí',
      no: 'No',
      save: 'Guardar',
      cancel: 'Cancelar',
      back: 'Volver',
      required: 'Requerido',
      loading: 'Cargando...',
      filter: 'Filtrar',
    },
  },

  en: {
    siteName: 'Venezuela Responds',
    tagline: 'Verified relief information after the June 24 earthquakes.',

    nav: {
      home: 'Home',
      help: 'I need help',
      donate: 'I want to help',
      verified: 'Verified info',
      resources: 'Resources',
      admin: 'Team',
    },

    home: {
      pathA: 'I need help',
      pathADesc: 'Missing family, shelters, emergency numbers, consular help.',
      pathB: 'I want to help',
      pathBDesc: 'Verified donation channels, collection centers, volunteering.',
      pathC: 'How we verify / Avoid scams',
      lastUpdated: 'Last updated',
      stats: {
        centers: 'verified centers',
        missing: 'people reported',
        channels: 'donation channels',
      },
    },

    badges: {
      verified: 'Verified',
      reported: 'Reported',
      legendTitle: 'Our standard',
      legendVerified: 'Verified: direct contact or established in-country organization.',
      legendReported: 'Reported: credible secondhand info. We never publish the unconfirmed.',
    },

    centers: {
      title: 'Collection Centers',
      filterState: 'State',
      filterAll: 'All',
      filterDirection: 'Type',
      directionDropoff: 'Drop off supplies',
      directionPickup: 'Receive supplies',
      search: 'Search by name, city...',
      empty: 'No centers match this selection.',
      acceptedItems: 'Accepts',
      urgentNeeds: 'Most needed',
      hours: 'Hours',
      contact: 'Contact',
    },

    missing: {
      title: 'Missing Persons',
      search: 'Search by name',
      lastSeen: 'Last seen',
      contactReporter: 'Contact the reporter',
      foundSafe: 'FOUND',
      empty: 'No reports match this selection.',
      report: 'Report a missing person',
      reportNote: 'Send us a message and a team member will reach out. We never publish without consent.',
    },

    donate: {
      title: 'How to help',
      moneyTitle: 'Verified channels',
      remittanceTitle: 'Send money directly to family',
      inKindTitle: 'In-kind guidance',
      skillsTitle: 'Skills-based volunteering',
      whyTrusted: 'Why trusted',
    },

    resources: {
      title: 'Resources & key numbers',
      emergency: 'Emergency',
      official: 'Official channels',
      consular: 'Consular help',
      antiScam: 'Avoid scams',
      shelters: 'Official shelters',
    },

    admin: {
      login: 'Sign in',
      email: 'Email',
      password: 'Password',
      signOut: 'Sign out',
      dashboard: 'Dashboard',
      pending: 'Pending queue',
      addCenter: '+ Center',
      addMissing: '+ Missing person',
      manageCenters: 'Centers',
      manageMissing: 'Missing persons',
      manageChannels: 'Donations',
      manageResources: 'Resources',
      team: 'Team',
      saveDraft: 'Save draft',
      savePublish: 'Save & publish',
      publish: 'Publish',
      unpublish: 'Unpublish',
      delete: 'Delete',
      addedBy: 'Added by',
      publishedBy: 'Published by',
      role: 'Role',
      roleEditor: 'Editor',
      roleAdmin: 'Admin',
      trustTier: 'Trust tier',
      direction: 'Center type',
    },

    common: {
      yes: 'Yes',
      no: 'No',
      save: 'Save',
      cancel: 'Cancel',
      back: 'Back',
      required: 'Required',
      loading: 'Loading...',
      filter: 'Filter',
    },
  },
};

export type Dict = (typeof dict)['es'];

export function isLocale(value: unknown): value is Locale {
  return value === 'es' || value === 'en';
}

export function t(locale: Locale): Dict {
  return dict[locale];
}
