// Локализация. Ключ — русская строка (как в коде), {x} — подстановки.
// Сообщения из main-процесса тоже переводятся здесь: ключи с {x} работают как шаблоны.
(function (root) {
  const LANGS = { ru: 'Русский', en: 'English', es: 'Español', de: 'Deutsch', fr: 'Français', zh: '中文' };
  const LOCALES = { ru: 'ru-RU', en: 'en-US', es: 'es-ES', de: 'de-DE', fr: 'fr-FR', zh: 'zh-CN' };
  const COLS = ['en', 'es', 'de', 'fr', 'zh'];
  // [ru, en, es, de, fr, zh]
  const ROWS = [
    // ---- шапка и меню ----
    ['Библиотека', 'Library', 'Biblioteca', 'Bibliothek', 'Bibliothèque', '资源库'],
    ['Вишлист', 'Wishlist', 'Lista de deseos', 'Wunschliste', 'Liste de souhaits', '愿望单'],
    ['Поиск…', 'Search…', 'Buscar…', 'Suchen…', 'Rechercher…', '搜索…'],
    ['Сортировка', 'Sorting', 'Orden', 'Sortierung', 'Tri', '排序'],
    ['Показать только избранное', 'Show favorites only', 'Mostrar solo favoritos', 'Nur Favoriten anzeigen', 'Afficher uniquement les favoris', '只显示收藏'],
    ['Таблица', 'Table', 'Tabla', 'Tabelle', 'Tableau', '表格'],
    ['Сетка', 'Grid', 'Cuadrícula', 'Raster', 'Grille', '网格'],
    ['⟳ Обновить', '⟳ Update', '⟳ Actualizar', '⟳ Aktualisieren', '⟳ Mettre à jour', '⟳ 更新'],
    ['Всё (библиотека, покупки, вишлист, Quixel)', 'Everything (library, purchases, wishlist, Quixel)', 'Todo (biblioteca, compras, lista de deseos, Quixel)', 'Alles (Bibliothek, Käufe, Wunschliste, Quixel)', 'Tout (bibliothèque, achats, liste de souhaits, Quixel)', '全部（资源库、购买记录、愿望单、Quixel）'],
    ['Библиотека и покупки', 'Library and purchases', 'Biblioteca y compras', 'Bibliothek und Käufe', 'Bibliothèque et achats', '资源库和购买记录'],
    ['Только вишлист и цены', 'Wishlist and prices only', 'Solo lista de deseos y precios', 'Nur Wunschliste und Preise', 'Liste de souhaits et prix uniquement', '仅愿望单和价格'],
    ['Только Quixel', 'Quixel only', 'Solo Quixel', 'Nur Quixel', 'Quixel uniquement', '仅 Quixel'],
    ['Язык', 'Language', 'Idioma', 'Sprache', 'Langue', '语言'],
    ['Обновлять цены вишлиста при запуске', 'Update wishlist prices on startup', 'Actualizar precios de la lista al iniciar', 'Wunschlistenpreise beim Start aktualisieren', 'Mettre à jour les prix au démarrage', '启动时更新愿望单价格'],
    ['Экспорт текущего списка в CSV', 'Export current list to CSV', 'Exportar la lista actual a CSV', 'Aktuelle Liste als CSV exportieren', 'Exporter la liste actuelle en CSV', '将当前列表导出为 CSV'],
    ['Открыть папку с данными', 'Open data folder', 'Abrir carpeta de datos', 'Datenordner öffnen', 'Ouvrir le dossier des données', '打开数据文件夹'],
    ['Выйти и сменить аккаунт', 'Sign out and switch account', 'Cerrar sesión y cambiar de cuenta', 'Abmelden und Konto wechseln', 'Se déconnecter et changer de compte', '退出并切换账号'],
    ['Аккаунт: {n}', 'Account: {n}', 'Cuenta: {n}', 'Konto: {n}', 'Compte : {n}', '账号：{n}'],
    ['Не выполнен вход', 'Not signed in', 'Sin iniciar sesión', 'Nicht angemeldet', 'Non connecté', '未登录'],
    // ---- стартовый экран ----
    ['Добро пожаловать в Fab Library', 'Welcome to Fab Library', 'Bienvenido a Fab Library', 'Willkommen bei Fab Library', 'Bienvenue dans Fab Library', '欢迎使用 Fab Library'],
    ['Приложение соберёт твою библиотеку Fab, покупки, вишлист и Megascans в офлайн-каталог. Данные хранятся только на этом компьютере, отдельно для каждого аккаунта.',
      'The app collects your Fab library, purchases, wishlist and Megascans into an offline catalog. Data stays on this computer only, separately for each account.',
      'La aplicación reúne tu biblioteca de Fab, compras, lista de deseos y Megascans en un catálogo sin conexión. Los datos se guardan solo en este equipo, por separado para cada cuenta.',
      'Die App sammelt deine Fab-Bibliothek, Käufe, Wunschliste und Megascans in einem Offline-Katalog. Die Daten bleiben nur auf diesem Computer, getrennt pro Konto.',
      'L’application rassemble ta bibliothèque Fab, tes achats, ta liste de souhaits et Megascans dans un catalogue hors ligne. Les données restent sur cet ordinateur, séparément pour chaque compte.',
      '本应用会把你的 Fab 资源库、购买记录、愿望单和 Megascans 整理成离线目录。数据只保存在这台电脑上，每个账号单独存放。'],
    ['Войти в аккаунт и загрузить библиотеку', 'Sign in and load my library', 'Iniciar sesión y cargar la biblioteca', 'Anmelden und Bibliothek laden', 'Se connecter et charger la bibliothèque', '登录并加载资源库'],
    ['Откроется окно входа в Fab — войди своим аккаунтом Epic. Затем приложение по очереди попросит вход в историю покупок Epic и на quixel.com. Первая загрузка занимает 15–30 минут, следующие — пару минут. Позже обновлять можно кнопкой «⟳ Обновить» вверху.',
      'A Fab sign-in window will open: use your Epic account. Then the app will ask you to sign in to the Epic purchase history and to quixel.com. The first load takes 15–30 minutes, later ones a couple of minutes. Use the «⟳ Update» button at the top to refresh later.',
      'Se abrirá la ventana de inicio de sesión de Fab: usa tu cuenta de Epic. Después la aplicación pedirá acceso al historial de compras de Epic y a quixel.com. La primera carga tarda 15–30 minutos; las siguientes, un par de minutos. Más tarde puedes actualizar con el botón «⟳ Actualizar».',
      'Ein Fab-Anmeldefenster öffnet sich: melde dich mit deinem Epic-Konto an. Danach fragt die App nacheinander nach der Anmeldung für den Epic-Kaufverlauf und quixel.com. Das erste Laden dauert 15–30 Minuten, spätere ein paar Minuten. Später aktualisierst du mit «⟳ Aktualisieren» oben.',
      'Une fenêtre de connexion Fab va s’ouvrir : utilise ton compte Epic. L’application demandera ensuite la connexion à l’historique d’achats Epic et à quixel.com. Le premier chargement prend 15 à 30 minutes, les suivants quelques minutes. Plus tard, utilise le bouton « ⟳ Mettre à jour » en haut.',
      '将打开 Fab 登录窗口：请使用你的 Epic 账号登录。随后应用会依次请求登录 Epic 购买记录和 quixel.com。首次加载需要 15–30 分钟，之后只需几分钟。以后可点击顶部的「⟳ 更新」刷新。'],
    // ---- вишлист: добавление ----
    ['Вставь ссылку на пак с fab.com и нажми Enter — название, цена и превью подтянутся сами', 'Paste a fab.com pack link and press Enter: title, price and preview are fetched automatically', 'Pega un enlace de fab.com y pulsa Enter: el título, el precio y la vista previa se cargan solos', 'Füge einen fab.com-Link ein und drücke Enter: Titel, Preis und Vorschau werden automatisch geladen', 'Colle un lien fab.com et appuie sur Entrée : titre, prix et aperçu se chargent automatiquement', '粘贴 fab.com 资源链接并按 Enter：标题、价格和预览会自动获取'],
    ['Добавить', 'Add', 'Añadir', 'Hinzufügen', 'Ajouter', '添加'],
    ['Нужна ссылка вида https://www.fab.com/listings/…', 'A link like https://www.fab.com/listings/… is required', 'Se necesita un enlace del tipo https://www.fab.com/listings/…', 'Benötigt wird ein Link wie https://www.fab.com/listings/…', 'Il faut un lien du type https://www.fab.com/listings/…', '需要形如 https://www.fab.com/listings/… 的链接'],
    ['Этот пак уже есть в твоей библиотеке.', 'This pack is already in your library.', 'Este paquete ya está en tu biblioteca.', 'Dieses Paket ist bereits in deiner Bibliothek.', 'Ce pack est déjà dans ta bibliothèque.', '这个资源已在你的资源库中。'],
    ['Загружаю данные с Fab…', 'Loading data from Fab…', 'Cargando datos de Fab…', 'Lade Daten von Fab…', 'Chargement des données Fab…', '正在从 Fab 加载数据…'],
    ['{e} Пак сохранён и подтянется при следующем обновлении.', '{e} The pack is saved and will be fetched on the next update.', '{e} El paquete se guardó y se cargará en la próxima actualización.', '{e} Das Paket ist gespeichert und wird beim nächsten Update geladen.', '{e} Le pack est enregistré et sera chargé à la prochaine mise à jour.', '{e} 资源已保存，将在下次更新时获取。'],
    ['Этот пак у тебя уже куплен — всё равно добавил.', 'You already own this pack; added it anyway.', 'Ya tienes este paquete; se añadió de todos modos.', 'Du besitzt dieses Paket bereits; trotzdem hinzugefügt.', 'Tu possèdes déjà ce pack ; il a quand même été ajouté.', '你已拥有该资源，仍已添加。'],
    ['Добавлено: {t}.', 'Added: {t}.', 'Añadido: {t}.', 'Hinzugefügt: {t}.', 'Ajouté : {t}.', '已添加：{t}。'],
    ['Добавлено: {t} — сейчас скидка {p}%.', 'Added: {t}, now {p}% off.', 'Añadido: {t}, ahora con {p}% de descuento.', 'Hinzugefügt: {t}, jetzt {p}% Rabatt.', 'Ajouté : {t}, actuellement −{p} %.', '已添加：{t}，当前折扣 {p}%。'],
    // ---- подборки ----
    ['Мои подборки', 'My collections', 'Mis colecciones', 'Meine Sammlungen', 'Mes collections', '我的合集'],
    ['новая', 'new', 'nueva', 'neu', 'nouvelle', '新'],
    ['Все подборки ({n})', 'All collections ({n})', 'Todas las colecciones ({n})', 'Alle Sammlungen ({n})', 'Toutes les collections ({n})', '全部合集（{n}）'],
    ['Открепить', 'Unpin', 'Desfijar', 'Lösen', 'Désépingler', '取消固定'],
    ['Закрепить кнопкой', 'Pin as a button', 'Fijar como botón', 'Als Schaltfläche anheften', 'Épingler comme bouton', '固定为按钮'],
    ['Удалить подборку', 'Delete collection', 'Eliminar colección', 'Sammlung löschen', 'Supprimer la collection', '删除合集'],
    ['Удалить подборку «{n}»?', 'Delete collection “{n}”?', '¿Eliminar la colección «{n}»?', 'Sammlung „{n}“ löschen?', 'Supprimer la collection « {n} » ?', '删除合集「{n}」？'],
    ['Поиск по подборкам', 'Search collections', 'Buscar colecciones', 'Sammlungen durchsuchen', 'Rechercher des collections', '搜索合集'],
    ['☆ — закрепить кнопку, × — удалить', '☆ pin as a button, × delete', '☆ fijar como botón, × eliminar', '☆ anheften, × löschen', '☆ épingler, × supprimer', '☆ 固定为按钮，× 删除'],
    ['Закрыть', 'Close', 'Cerrar', 'Schließen', 'Fermer', '关闭'],
    ['Подборки обновлены', 'Collections updated', 'Colecciones actualizadas', 'Sammlungen aktualisiert', 'Collections mises à jour', '合集已更新'],
    ['Ничего не найдено', 'Nothing found', 'No se encontró nada', 'Nichts gefunden', 'Aucun résultat', '没有找到'],
    ['Ничего не найдено.', 'Nothing found.', 'No se encontró nada.', 'Nichts gefunden.', 'Aucun résultat.', '没有找到。'],
    // ---- карточки и фильтры ----
    ['В избранное', 'Add to favorites', 'Añadir a favoritos', 'Zu Favoriten', 'Ajouter aux favoris', '加入收藏'],
    ['нет превью', 'no preview', 'sin vista previa', 'keine Vorschau', 'pas d’aperçu', '无预览'],
    ['Сбросить фильтры', 'Reset filters', 'Restablecer filtros', 'Filter zurücksetzen', 'Réinitialiser les filtres', '重置筛选'],
    ['Показать ещё', 'Show more', 'Mostrar más', 'Mehr anzeigen', 'Afficher plus', '显示更多'],
    ['Показать ещё (осталось {n})', 'Show more ({n} left)', 'Mostrar más (quedan {n})', 'Mehr anzeigen (noch {n})', 'Afficher plus (encore {n})', '显示更多（剩余 {n}）'],
    ['Найдено: {n}', 'Found: {n}', 'Encontrados: {n}', 'Gefunden: {n}', 'Trouvés : {n}', '找到：{n}'],
    ['Откуда', 'Source', 'Origen', 'Herkunft', 'Origine', '来源'],
    ['Тип', 'Type', 'Tipo', 'Typ', 'Type', '类型'],
    ['Стиль', 'Style', 'Estilo', 'Stil', 'Style', '风格'],
    ['Сеттинг', 'Setting', 'Ambientación', 'Setting', 'Univers', '题材'],
    ['Формат', 'Format', 'Formato', 'Format', 'Format', '格式'],
    ['Категория', 'Category', 'Categoría', 'Kategorie', 'Catégorie', '分类'],
    ['Подкатегория', 'Subcategory', 'Subcategoría', 'Unterkategorie', 'Sous-catégorie', '子分类'],
    ['Раздел', 'Section', 'Sección', 'Bereich', 'Section', '细分'],
    ['Где искать', 'Where to find', 'Dónde buscar', 'Wo zu finden', 'Où le trouver', '在哪里找'],
    ['Разрешение', 'Resolution', 'Resolución', 'Auflösung', 'Résolution', '分辨率'],
    ['Цена', 'Price', 'Precio', 'Preis', 'Prix', '价格'],
    ['Приоритет', 'Priority', 'Prioridad', 'Priorität', 'Priorité', '优先级'],
    ['Статус', 'Status', 'Estado', 'Status', 'Statut', '状态'],
    ['Куплено', 'Purchased', 'Comprado', 'Gekauft', 'Acheté', '已购买'],
    ['Бесплатно', 'Free', 'Gratis', 'Kostenlos', 'Gratuit', '免费'],
    ['Окружения и наборы', 'Environments and kits', 'Entornos y kits', 'Umgebungen und Kits', 'Environnements et kits', '环境与套件'],
    ['Здания и архитектура', 'Buildings and architecture', 'Edificios y arquitectura', 'Gebäude und Architektur', 'Bâtiments et architecture', '建筑'],
    ['Пропсы', 'Props', 'Props', 'Props', 'Props', '道具'],
    ['Растительность и природа', 'Plants and nature', 'Vegetación y naturaleza', 'Pflanzen und Natur', 'Végétation et nature', '植被与自然'],
    ['Транспорт', 'Vehicles', 'Vehículos', 'Fahrzeuge', 'Véhicules', '载具'],
    ['Оружие', 'Weapons', 'Armas', 'Waffen', 'Armes', '武器'],
    ['Персонажи и одежда', 'Characters and clothing', 'Personajes y ropa', 'Charaktere und Kleidung', 'Personnages et vêtements', '角色与服装'],
    ['Анимации', 'Animations', 'Animaciones', 'Animationen', 'Animations', '动画'],
    ['Quixel · 3D-модели', 'Quixel · 3D models', 'Quixel · modelos 3D', 'Quixel · 3D-Modelle', 'Quixel · modèles 3D', 'Quixel · 3D 模型'],
    ['Quixel · растения', 'Quixel · plants', 'Quixel · plantas', 'Quixel · Pflanzen', 'Quixel · plantes', 'Quixel · 植物'],
    ['Quixel · материалы', 'Quixel · materials', 'Quixel · materiales', 'Quixel · Materialien', 'Quixel · matériaux', 'Quixel · 材质'],
    ['Quixel · декали', 'Quixel · decals', 'Quixel · calcomanías', 'Quixel · Decals', 'Quixel · décalcomanies', 'Quixel · 贴花'],
    ['Материалы, декали, HDRI', 'Materials, decals, HDRI', 'Materiales, calcomanías, HDRI', 'Materialien, Decals, HDRI', 'Matériaux, décalcomanies, HDRI', '材质、贴花、HDRI'],
    ['Аудио', 'Audio', 'Audio', 'Audio', 'Audio', '音频'],
    ['Плагины и инструменты', 'Plugins and tools', 'Plugins y herramientas', 'Plugins und Tools', 'Plugins et outils', '插件与工具'],
    ['Геймплей: системы и шаблоны', 'Gameplay: systems and templates', 'Gameplay: sistemas y plantillas', 'Gameplay: Systeme und Vorlagen', 'Gameplay : systèmes et modèles', '玩法：系统与模板'],
    ['UI и иконки', 'UI and icons', 'UI e iconos', 'UI und Icons', 'UI et icônes', 'UI 与图标'],
    ['Примеры и обучение', 'Samples and tutorials', 'Ejemplos y tutoriales', 'Beispiele und Tutorials', 'Exemples et tutoriels', '示例与教程'],
    ['Только в Vault лаунчера', 'Launcher Vault only', 'Solo en el Vault del launcher', 'Nur im Launcher-Tresor', 'Uniquement dans le coffre du launcher', '仅在启动器库中'],
    ['Нет данных', 'No data', 'Sin datos', 'Keine Daten', 'Pas de données', '无数据'],
    ['Готовые персонажи', 'Ready characters', 'Personajes listos', 'Fertige Charaktere', 'Personnages prêts', '成品角色'],
    ['Волосы и грумы', 'Hair and grooms', 'Cabello y grooms', 'Haare und Grooms', 'Cheveux et grooms', '头发与毛发'],
    ['Одежда и аксессуары', 'Clothing and accessories', 'Ropa y accesorios', 'Kleidung und Accessoires', 'Vêtements et accessoires', '服装与配饰'],
    ['Текстуры кожи и тела', 'Skin and body textures', 'Texturas de piel y cuerpo', 'Haut- und Körpertexturen', 'Textures de peau et de corps', '皮肤与身体纹理'],
    ['Анимации и позы', 'Animations and poses', 'Animaciones y poses', 'Animationen und Posen', 'Animations et poses', '动画与姿势'],
    ['Инструменты и системы', 'Tools and systems', 'Herramientas y sistemas', 'Tools und Systeme', 'Outils et systèmes', '工具与系统'],
    ['Реализм', 'Realistic', 'Realista', 'Realistisch', 'Réaliste', '写实'],
    ['Стилизация', 'Stylized', 'Estilizado', 'Stilisiert', 'Stylisé', '风格化'],
    ['Средневековье / фэнтези', 'Medieval / fantasy', 'Medieval / fantasía', 'Mittelalter / Fantasy', 'Médiéval / fantasy', '中世纪 / 奇幻'],
    ['Sci‑fi / киберпанк', 'Sci-fi / cyberpunk', 'Ciencia ficción / cyberpunk', 'Sci-Fi / Cyberpunk', 'Science-fiction / cyberpunk', '科幻 / 赛博朋克'],
    ['СССР / постсовет', 'USSR / post-Soviet', 'URSS / postsoviético', 'UdSSR / postsowjetisch', 'URSS / post-soviétique', '苏联 / 后苏联'],
    ['Хоррор', 'Horror', 'Terror', 'Horror', 'Horreur', '恐怖'],
    ['Постапокалипсис / заброшка', 'Post-apocalyptic / abandoned', 'Postapocalíptico / abandonado', 'Postapokalyptisch / verlassen', 'Post-apocalyptique / abandonné', '末日 / 废墟'],
    ['Современный город', 'Modern city', 'Ciudad moderna', 'Moderne Stadt', 'Ville moderne', '现代城市'],
    ['Интерьер / архвиз', 'Interior / archviz', 'Interiores / archviz', 'Interieur / Archviz', 'Intérieur / archviz', '室内 / 建筑可视化'],
    ['Индустрия', 'Industrial', 'Industrial', 'Industrie', 'Industriel', '工业'],
    ['Природа', 'Nature', 'Naturaleza', 'Natur', 'Nature', '自然'],
    ['Военное', 'Military', 'Militar', 'Militär', 'Militaire', '军事'],
    ['Восток / Азия', 'East / Asia', 'Oriente / Asia', 'Osten / Asien', 'Orient / Asie', '东方 / 亚洲'],
    ['История / ретро', 'Historical / retro', 'Histórico / retro', 'Historisch / Retro', 'Historique / rétro', '历史 / 复古'],
    ['В движок', 'Engine-ready', 'Para el motor', 'Engine-fertig', 'Prêt pour le moteur', '可直接导入引擎'],
    ['Только файлом', 'File download only', 'Solo archivo', 'Nur als Datei', 'Fichier uniquement', '仅文件'],
    ['Есть {v}', 'Supports {v}', 'Compatible con {v}', 'Unterstützt {v}', 'Compatible {v}', '支持 {v}'],
    ['Нет {v}', 'No {v}', 'Sin {v}', 'Kein {v}', 'Pas de {v}', '不支持 {v}'],
    ['Версия не указана', 'Version not specified', 'Versión no indicada', 'Version nicht angegeben', 'Version non indiquée', '未注明版本'],
    ['Файлом', 'File', 'Archivo', 'Datei', 'Fichier', '文件'],
    ['до {v}', 'up to {v}', 'hasta {v}', 'bis {v}', 'jusqu’à {v}', '最高 {v}'],
    ['Fab и Quixel', 'Fab and Quixel', 'Fab y Quixel', 'Fab und Quixel', 'Fab et Quixel', 'Fab 和 Quixel'],
    ['Только Fab', 'Fab only', 'Solo Fab', 'Nur Fab', 'Fab uniquement', '仅 Fab'],
    ['Только Quixel / Bridge', 'Quixel / Bridge only', 'Solo Quixel / Bridge', 'Nur Quixel / Bridge', 'Quixel / Bridge uniquement', '仅 Quixel / Bridge'],
    ['до 1K', 'up to 1K', 'hasta 1K', 'bis 1K', 'jusqu’à 1K', '最高 1K'],
    ['на Fab', 'on Fab', 'en Fab', 'auf Fab', 'sur Fab', '在 Fab'],
    ['Есть ID', 'Has ID', 'Con ID', 'ID vorhanden', 'ID trouvé', '有 ID'],
    ['ID не найден', 'ID not found', 'ID no encontrado', 'ID nicht gefunden', 'ID introuvable', '未找到 ID'],
    ['на Fab: {v}', 'on Fab: {v}', 'en Fab: {v}', 'auf Fab: {v}', 'sur Fab : {v}', 'Fab 上：{v}'],
    ['Пак: {v}', 'Pack: {v}', 'Paquete: {v}', 'Paket: {v}', 'Pack : {v}', '资源包：{v}'],
    ['описание ещё загружается…', 'description is still loading…', 'la descripción aún se está cargando…', 'Beschreibung wird noch geladen…', 'description en cours de chargement…', '描述加载中…'],
    ['снят с quixel.com, ищите по ID в Fab', 'removed from quixel.com, search by ID on Fab', 'retirado de quixel.com, busca por ID en Fab', 'von quixel.com entfernt, auf Fab per ID suchen', 'retiré de quixel.com, cherche par ID sur Fab', '已从 quixel.com 下架，请在 Fab 按 ID 搜索'],
    ['Скопировать ID для поиска в Bridge / Fab', 'Copy ID to search in Bridge / Fab', 'Copiar el ID para buscar en Bridge / Fab', 'ID kopieren, um in Bridge / Fab zu suchen', 'Copier l’ID pour chercher dans Bridge / Fab', '复制 ID，在 Bridge / Fab 中搜索'],
    ['ID {id} скопирован', 'ID {id} copied', 'ID {id} copiado', 'ID {id} kopiert', 'ID {id} copié', '已复制 ID {id}'],
    // ---- вишлист ----
    ['Скидка сейчас', 'On sale now', 'En oferta ahora', 'Jetzt im Angebot', 'En promo maintenant', '正在打折'],
    ['Не дороже желаемой', 'At or below target price', 'Igual o por debajo del precio deseado', 'Höchstens Wunschpreis', 'Au prix souhaité ou moins', '不高于目标价'],
    ['Минимум за всё время', 'All-time low', 'Mínimo histórico', 'Allzeittief', 'Plus bas historique', '史低'],
    ['Высокий', 'High', 'Alta', 'Hoch', 'Haute', '高'],
    ['Средний', 'Medium', 'Media', 'Mittel', 'Moyenne', '中'],
    ['Низкий', 'Low', 'Baja', 'Niedrig', 'Basse', '低'],
    ['Не задан', 'Not set', 'Sin definir', 'Nicht festgelegt', 'Non définie', '未设置'],
    ['В вишлисте', 'In wishlist', 'En la lista', 'In der Wunschliste', 'Dans la liste', '在愿望单中'],
    ['Удалён из магазина', 'Removed from store', 'Retirado de la tienda', 'Aus dem Shop entfernt', 'Retiré de la boutique', '已下架'],
    ['Ждёт обновления', 'Waiting for update', 'Pendiente de actualizar', 'Wartet auf Update', 'En attente de mise à jour', '等待更新'],
    ['Официальный вишлист Fab', 'Official Fab wishlist', 'Lista oficial de Fab', 'Offizielle Fab-Wunschliste', 'Liste officielle Fab', 'Fab 官方愿望单'],
    ['Добавлено в приложении', 'Added in the app', 'Añadido en la aplicación', 'In der App hinzugefügt', 'Ajouté dans l’application', '在应用中添加'],
    ['Новый пак (ждёт обновления)', 'New pack (waiting for update)', 'Paquete nuevo (pendiente de actualizar)', 'Neues Paket (wartet auf Update)', 'Nouveau pack (en attente de mise à jour)', '新资源（等待更新）'],
    ['скидка до {d}', 'sale until {d}', 'oferta hasta {d}', 'Angebot bis {d}', 'promo jusqu’au {d}', '折扣至 {d}'],
    ['минимум за всё время', 'all-time low', 'mínimo histórico', 'Allzeittief', 'plus bas historique', '史低'],
    ['мин. было {v}', 'lowest was {v}', 'el mínimo fue {v}', 'Tiefstpreis war {v}', 'le plus bas était {v}', '最低曾为 {v}'],
    ['не дороже желаемой ({v})', 'at or below target ({v})', 'igual o por debajo del deseado ({v})', 'höchstens Wunschpreis ({v})', 'au prix souhaité ou moins ({v})', '不高于目标价（{v}）'],
    ['желаемая: {v}', 'target: {v}', 'deseado: {v}', 'Wunschpreis: {v}', 'souhaité : {v}', '目标价：{v}'],
    ['Приоритет: не задан', 'Priority: not set', 'Prioridad: sin definir', 'Priorität: nicht festgelegt', 'Priorité : non définie', '优先级：未设置'],
    ['Желаемая цена', 'Target price', 'Precio deseado', 'Wunschpreis', 'Prix souhaité', '目标价'],
    ['Заметка: зачем нужен, под какой проект', 'Note: why you need it, for which project', 'Nota: para qué lo necesitas, en qué proyecto', 'Notiz: wofür, für welches Projekt', 'Note : pourquoi, pour quel projet', '备注：用途、用于哪个项目'],
    ['Сохранить', 'Save', 'Guardar', 'Speichern', 'Enregistrer', '保存'],
    ['Отмена', 'Cancel', 'Cancelar', 'Abbrechen', 'Annuler', '取消'],
    ['Убрать из вишлиста', 'Remove from wishlist', 'Quitar de la lista', 'Aus der Wunschliste entfernen', 'Retirer de la liste', '从愿望单移除'],
    ['✎ заметка, приоритет, цена', '✎ note, priority, price', '✎ nota, prioridad, precio', '✎ Notiz, Priorität, Preis', '✎ note, priorité, prix', '✎ 备注、优先级、价格'],
    // ---- сортировки ----
    ['По типу', 'By type', 'Por tipo', 'Nach Typ', 'Par type', '按类型'],
    ['Недавно добавленные', 'Recently added', 'Añadidos recientemente', 'Zuletzt hinzugefügt', 'Ajoutés récemment', '最近添加'],
    ['По названию', 'By name', 'Por nombre', 'Nach Name', 'Par nom', '按名称'],
    ['Сначала новые покупки', 'Newest purchases first', 'Compras recientes primero', 'Neueste Käufe zuerst', 'Achats récents d’abord', '最新购买优先'],
    ['По автору', 'By author', 'Por autor', 'Nach Autor', 'Par auteur', '按作者'],
    ['Сначала избранные', 'Favorites first', 'Favoritos primero', 'Favoriten zuerst', 'Favoris d’abord', '收藏优先'],
    ['По категории', 'By category', 'Por categoría', 'Nach Kategorie', 'Par catégorie', '按分类'],
    ['Сначала скидки', 'Discounts first', 'Ofertas primero', 'Rabatte zuerst', 'Promos d’abord', '折扣优先'],
    ['По приоритету', 'By priority', 'Por prioridad', 'Nach Priorität', 'Par priorité', '按优先级'],
    ['Сначала дешёвые', 'Cheapest first', 'Más baratos primero', 'Günstigste zuerst', 'Moins chers d’abord', '价格从低到高'],
    ['Сначала дорогие', 'Most expensive first', 'Más caros primero', 'Teuerste zuerst', 'Plus chers d’abord', '价格从高到低'],
    // ---- таблицы, CSV, сводка ----
    ['Название', 'Name', 'Nombre', 'Name', 'Nom', '名称'],
    ['Версии UE', 'UE versions', 'Versiones de UE', 'UE-Versionen', 'Versions UE', 'UE 版本'],
    ['Заметка', 'Note', 'Nota', 'Notiz', 'Note', '备注'],
    ['Автор', 'Author', 'Autor', 'Autor', 'Auteur', '作者'],
    ['Дата покупки', 'Purchase date', 'Fecha de compra', 'Kaufdatum', 'Date d’achat', '购买日期'],
    ['Ссылка', 'Link', 'Enlace', 'Link', 'Lien', '链接'],
    ['Цена со скидкой', 'Sale price', 'Precio con descuento', 'Angebotspreis', 'Prix soldé', '折后价'],
    ['Скидка %', 'Discount %', 'Descuento %', 'Rabatt %', 'Remise %', '折扣 %'],
    ['всего паков', 'packs in total', 'paquetes en total', 'Pakete insgesamt', 'packs au total', '资源总数'],
    ['куплено', 'purchased', 'comprados', 'gekauft', 'achetés', '已购买'],
    ['потрачено всего', 'spent in total', 'gastado en total', 'insgesamt ausgegeben', 'dépensé au total', '总花费'],
    ['для MetaHuman', 'for MetaHuman', 'para MetaHuman', 'für MetaHuman', 'pour MetaHuman', '用于 MetaHuman'],
    ['только файлом', 'file download only', 'solo archivo', 'nur als Datei', 'fichier uniquement', '仅文件'],
    ['ассетов Megascans', 'Megascans assets', 'recursos de Megascans', 'Megascans-Assets', 'assets Megascans', 'Megascans 资源'],
    ['и на Fab, и на Quixel', 'on both Fab and Quixel', 'en Fab y en Quixel', 'auf Fab und Quixel', 'sur Fab et Quixel', 'Fab 和 Quixel 都有'],
    ['только на Fab', 'on Fab only', 'solo en Fab', 'nur auf Fab', 'sur Fab uniquement', '仅在 Fab'],
    ['только в Quixel / Bridge', 'in Quixel / Bridge only', 'solo en Quixel / Bridge', 'nur in Quixel / Bridge', 'dans Quixel / Bridge uniquement', '仅在 Quixel / Bridge'],
    ['паков в вишлисте', 'packs in wishlist', 'paquetes en la lista', 'Pakete in der Wunschliste', 'packs dans la liste', '愿望单资源数'],
    ['со скидкой сейчас', 'on sale now', 'en oferta ahora', 'jetzt im Angebot', 'en promo maintenant', '正在打折'],
    ['всё сразу по текущим ценам', 'everything at current prices', 'todo a precios actuales', 'alles zu aktuellen Preisen', 'tout aux prix actuels', '按现价全部购买'],
    ['экономия от скидок', 'saved with discounts', 'ahorro por descuentos', 'Ersparnis durch Rabatte', 'économie grâce aux promos', '折扣节省'],
    ['Поиск по названию, автору, тегам…', 'Search by name, author, tags…', 'Buscar por nombre, autor, etiquetas…', 'Nach Name, Autor, Tags suchen…', 'Rechercher par nom, auteur, tags…', '按名称、作者、标签搜索…'],
    ['Поиск по названию или Quixel-ID…', 'Search by name or Quixel ID…', 'Buscar por nombre o ID de Quixel…', 'Nach Name oder Quixel-ID suchen…', 'Rechercher par nom ou ID Quixel…', '按名称或 Quixel ID 搜索…'],
    ['Поиск по вишлисту: название, автор, заметка…', 'Search wishlist: name, author, note…', 'Buscar en la lista: nombre, autor, nota…', 'Wunschliste durchsuchen: Name, Autor, Notiz…', 'Rechercher : nom, auteur, note…', '搜索愿望单：名称、作者、备注…'],
    ['Данные обновлены {d}. Тип, стиль, сеттинг и MetaHuman определены автоматически по тегам и названию — возможны неточности.', 'Data updated {d}. Type, style, setting and MetaHuman are detected automatically from tags and titles and may be inaccurate.', 'Datos actualizados el {d}. Tipo, estilo, ambientación y MetaHuman se detectan automáticamente por etiquetas y títulos y pueden ser inexactos.', 'Daten aktualisiert am {d}. Typ, Stil, Setting und MetaHuman werden automatisch aus Tags und Titeln erkannt und können ungenau sein.', 'Données mises à jour le {d}. Type, style, univers et MetaHuman sont détectés automatiquement d’après les tags et les titres et peuvent être imprécis.', '数据更新于 {d}。类型、风格、题材和 MetaHuman 根据标签和标题自动识别，可能不准确。'],
    ['Данных пока нет — нажми «⟳ Обновить».', 'No data yet: press «⟳ Update».', 'Aún no hay datos: pulsa «⟳ Actualizar».', 'Noch keine Daten: drücke «⟳ Aktualisieren».', 'Pas encore de données : appuie sur « ⟳ Mettre à jour ».', '暂无数据：请点击「⟳ 更新」。'],
    // ---- статус и действия ----
    ['Открываю окно входа…', 'Opening sign-in window…', 'Abriendo la ventana de inicio de sesión…', 'Öffne Anmeldefenster…', 'Ouverture de la fenêtre de connexion…', '正在打开登录窗口…'],
    ['Обновление…', 'Updating…', 'Actualizando…', 'Aktualisiere…', 'Mise à jour…', '正在更新…'],
    ['Ошибка: {e}', 'Error: {e}', 'Error: {e}', 'Fehler: {e}', 'Erreur : {e}', '错误：{e}'],
    ['Готово: {l}', 'Done: {l}', 'Listo: {l}', 'Fertig: {l}', 'Terminé : {l}', '完成：{l}'],
    ['Готово', 'Done', 'Listo', 'Fertig', 'Terminé', '完成'],
    ['Выйти из аккаунтов Fab, Epic и Quixel в приложении? Данные на диске останутся.', 'Sign out of Fab, Epic and Quixel in the app? Data on disk will be kept.', '¿Cerrar sesión de Fab, Epic y Quixel en la aplicación? Los datos del disco se conservarán.', 'In der App von Fab, Epic und Quixel abmelden? Die Daten auf der Festplatte bleiben erhalten.', 'Se déconnecter de Fab, Epic et Quixel dans l’application ? Les données sur le disque sont conservées.', '在应用中退出 Fab、Epic 和 Quixel？磁盘上的数据会保留。'],
    ['Вы вышли. Нажмите «Войти», чтобы зайти другим аккаунтом', 'Signed out. Press “Sign in” to use another account', 'Sesión cerrada. Pulsa «Iniciar sesión» para usar otra cuenta', 'Abgemeldet. Drücke „Anmelden“, um ein anderes Konto zu nutzen', 'Déconnecté. Appuie sur « Se connecter » pour utiliser un autre compte', '已退出。点击「登录」使用其他账号'],
    ['CSV сохранён', 'CSV saved', 'CSV guardado', 'CSV gespeichert', 'CSV enregistré', 'CSV 已保存'],
    // ---- сообщения синхронизации (из main-процесса) ----
    ['Вход в Fab', 'Fab sign-in', 'Inicio de sesión en Fab', 'Fab-Anmeldung', 'Connexion à Fab', '登录 Fab'],
    ['Вход в аккаунт Epic (история покупок)', 'Epic account sign-in (purchase history)', 'Inicio de sesión de Epic (historial de compras)', 'Epic-Anmeldung (Kaufverlauf)', 'Connexion Epic (historique d’achats)', '登录 Epic 账号（购买记录）'],
    ['Вход на quixel.com', 'quixel.com sign-in', 'Inicio de sesión en quixel.com', 'quixel.com-Anmeldung', 'Connexion à quixel.com', '登录 quixel.com'],
    ['{a}: войдите в аккаунт в открывшемся окне', '{a}: sign in in the window that opened', '{a}: inicia sesión en la ventana abierta', '{a}: im geöffneten Fenster anmelden', '{a} : connecte-toi dans la fenêtre ouverte', '{a}：请在弹出的窗口中登录'],
    ['{a}: превью {n}', '{a}: previews {n}', '{a}: vistas previas {n}', '{a}: Vorschauen {n}', '{a} : aperçus {n}', '{a}：预览 {n}'],
    ['Megascans на Fab', 'Megascans on Fab', 'Megascans en Fab', 'Megascans auf Fab', 'Megascans sur Fab', 'Fab 上的 Megascans'],
    ['Библиотека: получено {n}', 'Library: {n} received', 'Biblioteca: {n} recibidos', 'Bibliothek: {n} empfangen', 'Bibliothèque : {n} reçus', '资源库：已获取 {n}'],
    ['Подробности новых паков: {a} из {b}', 'New pack details: {a} of {b}', 'Detalles de paquetes nuevos: {a} de {b}', 'Details neuer Pakete: {a} von {b}', 'Détails des nouveaux packs : {a} sur {b}', '新资源详情：{a} / {b}'],
    ['Официальный вишлист: {n}', 'Official wishlist: {n}', 'Lista oficial: {n}', 'Offizielle Wunschliste: {n}', 'Liste officielle : {n}', '官方愿望单：{n}'],
    ['Свои добавленные: {a} из {b}', 'Added in app: {a} of {b}', 'Añadidos en la app: {a} de {b}', 'In der App hinzugefügt: {a} von {b}', 'Ajoutés dans l’app : {a} sur {b}', '应用中添加：{a} / {b}'],
    ['Megascans на Fab: {n}', 'Megascans on Fab: {n}', 'Megascans en Fab: {n}', 'Megascans auf Fab: {n}', 'Megascans sur Fab : {n}', 'Fab 上的 Megascans：{n}'],
    ['Проверка, какие Megascans уже твои: {a} из {b}', 'Checking which Megascans you own: {a} of {b}', 'Comprobando qué Megascans tienes: {a} de {b}', 'Prüfe, welche Megascans dir gehören: {a} von {b}', 'Vérification des Megascans possédés : {a} sur {b}', '检查已拥有的 Megascans：{a} / {b}'],
    ['Quixel-ID: {a} из {b}', 'Quixel ID: {a} of {b}', 'ID de Quixel: {a} de {b}', 'Quixel-ID: {a} von {b}', 'ID Quixel : {a} sur {b}', 'Quixel ID：{a} / {b}'],
    ['Quixel.com: описания {a} из {b}', 'Quixel.com: descriptions {a} of {b}', 'Quixel.com: descripciones {a} de {b}', 'Quixel.com: Beschreibungen {a} von {b}', 'Quixel.com : descriptions {a} sur {b}', 'Quixel.com：描述 {a} / {b}'],
    ['Обновление уже идёт', 'Update is already running', 'Ya hay una actualización en curso', 'Update läuft bereits', 'Mise à jour déjà en cours', '更新正在进行'],
    ['Вход в Fab не выполнен', 'Not signed in to Fab', 'No se inició sesión en Fab', 'Nicht bei Fab angemeldet', 'Non connecté à Fab', '未登录 Fab'],
    ['Нужен вход в Fab', 'Fab sign-in required', 'Se requiere iniciar sesión en Fab', 'Fab-Anmeldung erforderlich', 'Connexion à Fab requise', '需要登录 Fab'],
    ['Библиотека: {a} паков (новых {b})', 'Library: {a} packs ({b} new)', 'Biblioteca: {a} paquetes ({b} nuevos)', 'Bibliothek: {a} Pakete ({b} neu)', 'Bibliothèque : {a} packs ({b} nouveaux)', '资源库：{a} 个（新增 {b}）'],
    ['Покупки: {n} оплаченных заказов', 'Purchases: {n} paid orders', 'Compras: {n} pedidos pagados', 'Käufe: {n} bezahlte Bestellungen', 'Achats : {n} commandes payées', '购买：{n} 个已付款订单'],
    ['Покупки: вход в аккаунт Epic не выполнен — пропущено', 'Purchases: not signed in to Epic, skipped', 'Compras: sin sesión en Epic, omitido', 'Käufe: nicht bei Epic angemeldet, übersprungen', 'Achats : non connecté à Epic, ignoré', '购买：未登录 Epic，已跳过'],
    ['Вишлист: {a} паков, со скидкой {b}', 'Wishlist: {a} packs, {b} on sale', 'Lista: {a} paquetes, {b} en oferta', 'Wunschliste: {a} Pakete, {b} im Angebot', 'Liste : {a} packs, {b} en promo', '愿望单：{a} 个，{b} 个打折'],
    ['Quixel.com: {n} ассетов', 'Quixel.com: {n} assets', 'Quixel.com: {n} recursos', 'Quixel.com: {n} Assets', 'Quixel.com : {n} assets', 'Quixel.com：{n} 个资源'],
    ['Quixel.com: вход не выполнен — пропущено', 'Quixel.com: not signed in, skipped', 'Quixel.com: sin sesión, omitido', 'Quixel.com: nicht angemeldet, übersprungen', 'Quixel.com : non connecté, ignoré', 'Quixel.com：未登录，已跳过'],
    ['Quixel-ID найдены для {n} паков Fab', 'Quixel IDs found for {n} Fab packs', 'ID de Quixel encontrados para {n} paquetes de Fab', 'Quixel-IDs für {n} Fab-Pakete gefunden', 'ID Quixel trouvés pour {n} packs Fab', '为 {n} 个 Fab 资源找到 Quixel ID'],
    ['Fab вернул ошибку {n} при чтении библиотеки', 'Fab returned error {n} while reading the library', 'Fab devolvió el error {n} al leer la biblioteca', 'Fab meldete Fehler {n} beim Lesen der Bibliothek', 'Fab a renvoyé l’erreur {n} en lisant la bibliothèque', '读取资源库时 Fab 返回错误 {n}'],
    ['Fab вернул ошибку {n} при чтении Megascans', 'Fab returned error {n} while reading Megascans', 'Fab devolvió el error {n} al leer Megascans', 'Fab meldete Fehler {n} beim Lesen von Megascans', 'Fab a renvoyé l’erreur {n} en lisant Megascans', '读取 Megascans 时 Fab 返回错误 {n}'],
    ['Epic вернул ошибку {n} при чтении покупок', 'Epic returned error {n} while reading purchases', 'Epic devolvió el error {n} al leer las compras', 'Epic meldete Fehler {n} beim Lesen der Käufe', 'Epic a renvoyé l’erreur {n} en lisant les achats', '读取购买记录时 Epic 返回错误 {n}'],
    ['Fab вернул ошибку {n}', 'Fab returned error {n}', 'Fab devolvió el error {n}', 'Fab meldete Fehler {n}', 'Fab a renvoyé l’erreur {n}', 'Fab 返回错误 {n}'],
    ['Такого пака на Fab нет (возможно, удалён)', 'No such pack on Fab (it may have been removed)', 'Ese paquete no existe en Fab (puede que se haya eliminado)', 'Dieses Paket gibt es auf Fab nicht (evtl. entfernt)', 'Ce pack n’existe pas sur Fab (il a peut-être été retiré)', 'Fab 上没有这个资源（可能已删除）'],
    ['quixel.com вернул ошибку {n} — войдите на quixel.com ещё раз', 'quixel.com returned error {n}: sign in to quixel.com again', 'quixel.com devolvió el error {n}: vuelve a iniciar sesión en quixel.com', 'quixel.com meldete Fehler {n}: bitte erneut bei quixel.com anmelden', 'quixel.com a renvoyé l’erreur {n} : reconnecte-toi à quixel.com', 'quixel.com 返回错误 {n}：请重新登录 quixel.com'],
    ['Сессия quixel.com истекла. Нажмите «Обновить → Только Quixel» ещё раз — загрузка продолжится с того же места.', 'The quixel.com session expired. Press “Update → Quixel only” again; loading resumes where it stopped.', 'La sesión de quixel.com caducó. Pulsa «Actualizar → Solo Quixel» de nuevo; la carga continuará donde se detuvo.', 'Die quixel.com-Sitzung ist abgelaufen. Drücke erneut „Aktualisieren → Nur Quixel“; das Laden wird fortgesetzt.', 'La session quixel.com a expiré. Appuie à nouveau sur « Mettre à jour → Quixel uniquement » ; le chargement reprendra là où il s’est arrêté.', 'quixel.com 会话已过期。请再次点击「更新 → 仅 Quixel」，将从中断处继续加载。'],
  ];

  const DICT = {}, PATS = {};
  for (const l of COLS) { DICT[l] = {}; PATS[l] = []; }
  const reEsc = (s) => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&');
  for (const r of ROWS) {
    COLS.forEach((l, i) => { if (r[i + 1] != null) DICT[l][r[0]] = r[i + 1]; });
    if (/\{\w+\}/.test(r[0])) {
      const names = [...r[0].matchAll(/\{(\w+)\}/g)].map(m => m[1]);
      const re = new RegExp('^' + reEsc(r[0]).replace(/\\?\{\w+\\?\}/g, '(.+?)') + '$', 's');
      COLS.forEach((l, i) => { if (r[i + 1] != null) PATS[l].push([re, r[i + 1], names]); });
    }
  }

  let LANG = 'ru';
  function detect() { const n = String((root.navigator && root.navigator.language) || 'en').slice(0, 2).toLowerCase(); return LANGS[n] ? n : 'en'; }
  function setLang(l) { LANG = LANGS[l] ? l : 'ru'; }
  function getLang() { return LANG; }
  function locale() { return LOCALES[LANG] || 'ru-RU'; }
  // tr('Найдено: {n}', {n: 5}) или tr(готовая_русская_строка_с_числами) — шаблоны распознаются сами.
  function tr(s, vars) {
    if (s == null) return s;
    s = String(s);
    let out = null;
    if (LANG !== 'ru') {
      const d = DICT[LANG];
      out = d[s];
      if (out == null && !vars) {
        for (const [re, t, names] of PATS[LANG]) {
          const m = s.match(re);
          if (m) { out = t; names.forEach((n, i) => { const v = m[i + 1]; out = out.split('{' + n + '}').join(/^[\d\s.,%−-]+$/.test(v) ? v : tr(v)); }); break; }
        }
      }
    }
    if (out == null) out = s;
    if (vars) for (const k of Object.keys(vars)) out = out.split('{' + k + '}').join(vars[k]);
    return out;
  }
  // Перевод статичного HTML: текстовые узлы, placeholder, title, aria-label.
  function localizeDom(rootEl) {
    const walk = (el) => {
      for (const n of el.childNodes) {
        if (n.nodeType === 3) { const raw = n.__ru ?? n.nodeValue; const t = raw.trim(); if (t && /[А-Яа-яЁё]/.test(t)) { n.__ru = raw; n.nodeValue = raw.replace(t, tr(t)); } }
        else if (n.nodeType === 1 && n.tagName !== 'SCRIPT') {
          for (const a of ['placeholder', 'title', 'aria-label']) { if (n.hasAttribute(a)) { const k = '__ru_' + a; n[k] = n[k] ?? n.getAttribute(a); n.setAttribute(a, tr(n[k])); } }
          walk(n);
        }
      }
    };
    walk(rootEl);
  }
  const api = { LANGS, tr, setLang, getLang, detect, locale, localizeDom, ROWS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.I18N = api;
})(typeof window !== 'undefined' ? window : globalThis);
