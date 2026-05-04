// 에셋 경로 레지스트리 — 실제 이미지로 교체 시 여기만 수정
export const ASSETS = {
  characters: {
    sui:    'assets/characters/sui.png',
    kya:    'assets/characters/kya.png',
    jiyu:   'assets/characters/jiyu.png',
    haum:   'assets/characters/haum.png',
    leesol: 'assets/characters/leesol.png',
  },
  spritesheets: {
    sui:    'assets/spritesheets/sui-sheet.png',
    kya:    'assets/spritesheets/kya-sheet.png',
    jiyu:   'assets/spritesheets/jiyu-sheet.png',
    haum:   'assets/spritesheets/haum-sheet.png',
    leesol: 'assets/spritesheets/leesol-sheet.png',
  },
  SHEET_FRAME_W: 391,
  SHEET_FRAME_H: 600,
  cards: {
    back:   'assets/cards/card-back.svg',
    normal: 'assets/cards/frame-normal.svg',
    rare:   'assets/cards/frame-rare.svg',
    sr:     'assets/cards/frame-sr.svg',
  },
  // 캐릭터 치비 초상화 (FTUE 카드, 사이드바용)
  portraits: {
    sui:    'assets/extracted/character/sui_profile_picture_chibi.png',
    kya:    'assets/extracted/character/kia_profile_chibi.png',
    jiyu:   'assets/extracted/character/jiyu_profile_chibi.png',
    haum:   'assets/extracted/character/haheum_profile_chibi.png',
    leesol: 'assets/extracted/character/iseul_profile_chibi.png',
  },
  // 캐릭터 메인 스탠딩 (홈 중앙용)
  standing: {
    sui:    'assets/extracted/character/sui_chibi_main_standing.png',
    kya:    'assets/extracted/character/character_kia_chibi.png',
    jiyu:   'assets/extracted/character/character_jiyu_chibi.png',
    haum:   'assets/extracted/character/character_haeum_chibi.png',
    leesol: 'assets/extracted/character/character_iseul_chibi.png',
  },
  // 배경
  bg: {
    home:  'assets/extracted/background/background_waikikiii_tour.png',
    room:  'assets/extracted/background/background_room_waikiki_sunset.png',
    beach: 'assets/extracted/background/background_tropical_beach_sunset.png',
    house: 'assets/bg/house-bg.svg',
    game:  'assets/bg/game-bg.svg',
  },
  // FTUE 캐릭터 선택 카드 프레임
  ftueCards: {
    kya:    'assets/bg/ftue_card_kya.png',
    jiyu:   'assets/bg/ftue_card_jiyu.png',
    sui:    'assets/bg/ftue_card_sui.png',
    haum:   'assets/bg/ftue_card_haum.png',
    leesol: 'assets/bg/ftue_card_leesol.png',
  },
  // UI 프레임
  uiFrame: {
    title:         'assets/extracted/ui_frame/title_waikikiii_tour.png',
    banner:        'assets/extracted/ui_frame/ui_banner_fandom_trip_story.png',
    dailyPlan:     'assets/extracted/ui_frame/daily_plan_frame.png',
    dailyCheckin:  'assets/extracted/ui_frame/daily_checkin_frame.png',
    levelFrame:    'assets/extracted/ui_frame/level_frame.png',
    memberLabel:   'assets/extracted/ui_frame/main_member_label_sui.png',
    affinityBar:   'assets/extracted/ui_frame/affinity_progress_bar.png',
    charListFrame: 'assets/extracted/ui_frame/character_list_entry_frame_empty.png',
    charInfoPanel: 'assets/extracted/ui_frame/ui_frame_character_info_panel.png',
    speechBubble:  'assets/extracted/ui_frame/ui_speech_bubble_chibi.png',
    selectionBase: 'assets/extracted/ui_frame/panel_character_selection_base_frame.png',
    logo:          'assets/extracted/ui_frame/ui_logo_waikikiii_tour.png',
    welcomeMsg:    'assets/extracted/ui_frame/welcome_message_frame.png',
    nameplates: {
      sui:    'assets/extracted/ui_frame/ui_nameplate_sui_seashell.png',
      kya:    'assets/extracted/ui_frame/ui_nameplate_kiya_seashell.png',
      jiyu:   'assets/extracted/ui_frame/ui_nameplate_jiyu_star.png',
      haum:   'assets/extracted/ui_frame/ui_nameplate_haeum_flower.png',
      leesol: 'assets/extracted/ui_frame/ui_nameplate_isul_seashell.png',
    },
  },
  // 아이콘
  icons: {
    coin:     'assets/extracted/icon/coin_icon_gold.png',
    diamond:  'assets/extracted/icon/gem_icon_diamond.png',
    heart:    'assets/extracted/icon/energy_icon_heart.png',
    airplane: 'assets/extracted/icon/icon_airplane_white.png',
  },
  // 스프라이트시트 (idle 3f — 3프레임 가로 스트립 256×256 per frame)
  sprites: {
    sui:    'assets/characters/sui_sprites/sui_idle_3f.png',
    kya:    'assets/characters/kya_sprites/kya_idle_3f.png',
    jiyu:   'assets/characters/jiyu_sprites/jiyu_idle_3f.png',
    haum:   'assets/characters/haum_sprites/haum_idle_3f.png',
    leesol: 'assets/characters/leesol_sprites/leesol_idle_3f.png',
  },
  // 버튼
  buttons: {
    startTrip:    'assets/extracted/ui_button/button_start_todays_trip.png',
    randomSelect: 'assets/extracted/ui_button/button_random_select.png',
    touchToStart: 'assets/extracted/ui_button/ui_button_touch_to_start.png',
    save:         'assets/extracted/ui_button/button_save.png',
    preview:      'assets/extracted/ui_button/button_preview.png',
    applyDecorate:'assets/extracted/ui_button/button_apply_decorate.png',
    voice:        'assets/extracted/ui_button/button_todays_voice.png',
    letter:       'assets/extracted/ui_button/button_letter.png',
    ar:           'assets/extracted/ui_button/button_ar_pose.png',
  },
  // 체크인/체크박스
  checkin: {
    claimed:   'assets/extracted/ui_button/checkin_day_marker_claimed.png',
    unclaimed: 'assets/extracted/ui_button/checkin_day_marker_unclaimed.png',
    checked:   'assets/extracted/ui_button/checkbox_completed_pink.png',
    unchecked: 'assets/extracted/ui_button/checkbox_uncompleted_empty.png',
  },
  // 룸 탭
  roomTabs: {
    decorate:     'assets/extracted/ui_button/tab_decorate_selected.png',
    outfit:       'assets/extracted/ui_button/tab_outfit_deselected.png',
    furniture:    'assets/extracted/ui_button/tab_furniture_deselected.png',
    gift:         'assets/extracted/ui_button/tab_gift_deselected.png',
    conversation: 'assets/extracted/ui_button/tab_conversation_deselected.png',
  },
  // 박스 탭
  boxTabs: {
    all:    'assets/extracted/ui_button/ui_tab_all_active.png',
    sui:    'assets/extracted/ui_button/ui_tab_sui_inactive.png',
    kya:    'assets/extracted/ui_button/ui_tab_kiya_inactive.png',
    jiyu:   'assets/extracted/ui_button/ui_tab_jiyu_inactive.png',
    haum:   'assets/extracted/ui_button/ui_tab_haeum_inactive.png',
    leesol: 'assets/extracted/ui_button/ui_tab_isul_inactive.png',
  },
  // 캐릭터 아이콘
  charIcons: {
    sui:    'assets/extracted/icon/icon_sui_energy.png',
    kya:    'assets/extracted/icon/icon_kia_calm.png',
    jiyu:   'assets/extracted/icon/icon_jiyu_freshness.png',
    haum:   'assets/extracted/icon/icon_haeum_kindness.png',
    leesol: 'assets/extracted/icon/icon_iseul_trendy.png',
  },
} as const

export const MEMBERS = [
  { id: 'sui'    as const, name: 'Sui',    korName: '수이',  color: 0x8B6FBF, hex: '#8B6FBF', light: '#C4B5FD', trait: '에너지' },
  { id: 'kya'    as const, name: 'Kya',    korName: '키아',  color: 0xD4A843, hex: '#D4A843', light: '#FDE68A', trait: '자본형' },
  { id: 'jiyu'   as const, name: 'Jiyu',   korName: '지유',  color: 0x2C7A4B, hex: '#2C7A4B', light: '#6EE7B7', trait: '상큼함' },
  { id: 'haum'   as const, name: 'Haum',   korName: '하음',  color: 0x8B3A3A, hex: '#8B3A3A', light: '#FCA5A5', trait: '다정함' },
  { id: 'leesol' as const, name: 'Leesol', korName: '이솔',  color: 0x1A4A8B, hex: '#1A4A8B', light: '#93C5FD', trait: '트렌디' },
] as const
