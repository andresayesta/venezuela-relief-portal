// Static bilingual UI dictionary. User-entered content is NOT translated.
// Stored in a cookie ('locale') so server components can read it.

export type Locale = 'es' | 'en';
export const LOCALES: Locale[] = ['es', 'en'];
export const DEFAULT_LOCALE: Locale = 'es';
export const LOCALE_COOKIE = 'locale';

export const dict = {
  es: {
    siteName: 'Venezuela Responde',
    tagline: 'Ayuda verificada para Venezuela tras el terremoto. Información real, revisada por personas reales.',
    disclaimer:
      'Venezuela Responde es un esfuerzo independiente y voluntario. No somos una agencia gubernamental ni una organización de recaudación; te dirigimos a recursos y canales verificados. La información se actualiza constantemente.',

    about: {
      whatHappened: 'Qué pasó',
      whatHappenedBody1:
        'El 24 de junio de 2026, dos potentes terremotos sacudieron el occidente de Venezuela con menos de un minuto de diferencia. Fue uno de los eventos sísmicos más fuertes que el país ha vivido en más de un siglo, y causó daños extensos en Caracas, La Guaira y los estados vecinos. Miles de familias resultaron afectadas, y la necesidad de refugio, atención médica y suministros básicos es urgente.',
      whatHappenedBody2:
        'En las horas siguientes, algo más se propagó junto con los daños: información falsa, estafas y rumores sin confirmar. Este sitio existe para cortar ese ruido con información en la que puedes confiar.',
      whyTitle: 'Por qué existe este sitio',
      whyBody:
        'Venezuela Responde está a cargo de un equipo pequeño y de confianza, conectado con Venezuela y su diáspora. Nuestra promesa es simple: nada llega a este sitio hasta que una persona real lo verifica. En un desastre, la información precisa es una forma de ayuda en sí misma, y la información falsa puede causar daño real. Todo aquí está organizado para que actúes rápido y con seguridad, ya sea que necesites ayuda o que quieras darla.',
      howHelpTitle: 'Cómo puedes ayudar',
      howHelpIntro: 'Hay tres formas de ayudar ahora mismo, estés donde estés.',
      howHelp1Title: 'Comparte este sitio',
      howHelp1Body:
        'Alguien en tu red tiene familia o vínculos en Venezuela. El alcance ahorra tiempo, y el tiempo salva vidas.',
      howHelp2Title: 'Envía lo que sabes',
      howHelp2Body:
        'Si tienes información real — un centro de acopio, una persona desaparecida, un esfuerzo de ayuda — envíala en el sitio. Nuestro equipo la verifica antes de publicarla. Para reportes de personas desaparecidas, envía datos correctos y solo con el conocimiento de la familia.',
      howHelp3Title: 'Dona por canales verificados',
      howHelp3Body:
        'Si puedes donar, usa los canales confiables que aparecen en "Quiero ayudar", no un enlace cualquiera de redes sociales. La ayuda concentrada en organizaciones legítimas es la que más impacto tiene.',
    },

    verify: {
      title: 'Cómo verificamos',
      body:
        'Cada entrada en este sitio es revisada por un miembro de nuestro equipo antes de publicarse. Confirmamos fuentes, revisamos enlaces y damos prioridad a la información de personas con vínculos directos al esfuerzo o la organización. Lo que podemos confirmar se marca como Verificado. Lo que no podemos confirmar queda en revisión y nunca se muestra públicamente.',
      scamTitle: 'Cómo detectar una estafa',
      scamIntro: 'Los desastres atraen estafas. Algunas comprobaciones rápidas antes de donar:',
      scamBullets: [
        'Desconfía de recaudaciones nuevas, sin historial y sin un organizador con nombre.',
        'Busca una organización real y establecida detrás de la solicitud, no solo una cuenta personal.',
        'Evita enlaces que te presionan a actuar de inmediato o a pagar de formas inusuales.',
        'Ante la duda, dona por los canales verificados que aparecen aquí.',
      ],
      trustClose: 'Si ves algo en este sitio que parece incorrecto, avísanos. La confianza es lo más importante.',
    },

    submitPrompt: {
      headline: '¿Tienes información real? Envíala y nuestro equipo la verificará antes de publicarla.',
      reassurance: 'Las solicitudes son revisadas por una persona. Nada se publica de forma automática.',
    },

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
      pathADesc: 'Encuentra familia desaparecida, refugios, números de emergencia y ayuda consular.',
      pathB: 'Quiero ayudar',
      pathBDesc: 'Canales de donación verificados, centros de acopio y formas de ser voluntario.',
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
    siteName: 'We Help Venezuela',
    tagline: 'Verified earthquake relief for Venezuela. Real information, checked by real people.',
    disclaimer:
      'We Help Venezuela is an independent, volunteer effort. We are not a government agency or a fundraising organization; we point you to verified resources and channels. Information is updated continuously.',

    about: {
      whatHappened: 'What happened',
      whatHappenedBody1:
        'On June 24, 2026, two powerful earthquakes struck western Venezuela within a minute of each other. It was one of the strongest seismic events the country has seen in more than a century, and it caused widespread damage across Caracas, La Guaira, and the surrounding states. Thousands of families have been affected, and the need for shelter, medical care, and basic supplies is urgent.',
      whatHappenedBody2:
        'In the hours that followed, something else spread alongside the damage: misinformation, fake fundraisers, and unverified rumors. This site exists to cut through that noise with information you can trust.',
      whyTitle: 'Why this site exists',
      whyBody:
        'We Help Venezuela is run by a small, trusted team connected to Venezuela and its diaspora. Our promise is simple: nothing reaches this site until a real person verifies it. In a disaster, accurate information is its own form of aid, and bad information can do real harm. Everything here is organized to help you act quickly and safely, whether you need help or want to give it.',
      howHelpTitle: 'How you can help',
      howHelpIntro: 'There are three ways to help right now, wherever you are.',
      howHelp1Title: 'Share this site',
      howHelp1Body:
        'Someone in your network has family or ties in Venezuela. Reach saves time, and time saves lives.',
      howHelp2Title: 'Submit what you know',
      howHelp2Body:
        'If you have real information — a collection center, a missing person, an aid effort — submit it on the site. Our team verifies it before it goes public. For missing-person reports, please submit accurate details and only with the family\'s awareness.',
      howHelp3Title: 'Give through verified channels',
      howHelp3Body:
        'If you can donate, use the trusted channels listed under "I want to help," not a random link from social media. Concentrated giving through legitimate organizations does the most good.',
    },

    verify: {
      title: 'How we verify',
      body:
        'Every entry on this site is reviewed by a member of our team before it is published. We confirm sources, check links, and prioritize information from people with direct ties to the effort or organization. Items we can confirm are marked Verified. Anything we cannot confirm stays in review and is never shown publicly.',
      scamTitle: 'How to spot a fake fundraiser',
      scamIntro: 'Disasters attract scams. A few quick checks before you give:',
      scamBullets: [
        'Be wary of brand-new fundraisers with no history and no named organizer.',
        'Look for a real, established organization behind the request, not just a personal account.',
        'Avoid links that pressure you to act immediately or pay in unusual ways.',
        'When in doubt, give through the verified channels listed here.',
      ],
      trustClose: 'If you see something on this site that looks wrong, tell us. Trust is the whole point.',
    },

    submitPrompt: {
      headline: 'Have real information? Submit it and our team will verify it before it goes live.',
      reassurance: 'Submissions are reviewed by a person. Nothing is published automatically.',
    },

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
      pathADesc: 'Find missing family, shelters, emergency numbers, and consular help.',
      pathB: 'I want to help',
      pathBDesc: 'Verified donation channels, collection centers, and ways to volunteer.',
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
