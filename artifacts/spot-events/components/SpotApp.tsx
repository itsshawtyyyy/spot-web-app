import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  Keyboard,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';

type Category = 'Party' | 'Concerti' | 'Mostre' | 'Aperitivi';
type CategoryFilter = 'Tutti' | Category;
type Screen = 'explore' | 'map' | 'saved' | 'profile';
type ModalType = 'login' | 'form' | 'detail' | null;
type CoverId = 'cover-concert' | 'cover-aperitivo' | 'cover-gallery';

type SpotEvent = {
  id: string;
  title: string;
  place: string;
  category: Category;
  date: string;
  image: string;
  description: string;
  lat: number;
  lng: number;
};

type DemoUser = {
  email: string;
  isAdmin: boolean;
};

type ReactionEmoji = '❤️' | '🔥' | '😍' | '👏';
type ReactionsByEvent = Record<
  string,
  Partial<Record<ReactionEmoji, string[]>>
>;

type EventDraft = {
  title: string;
  place: string;
  category: Category;
  date: string;
  image: string;
  description: string;
};

type StoredState = {
  events?: SpotEvent[];
  savedIds?: string[];
  user?: DemoUser | null;
  reactions?: ReactionsByEvent;
};

type Palette = ReturnType<typeof useColors>;

const STORAGE_KEY = 'spot-local-state-v1';
const CATEGORIES: Category[] = ['Party', 'Concerti', 'Mostre', 'Aperitivi'];
const REACTION_EMOJIS: ReactionEmoji[] = ['❤️', '🔥', '😍', '👏'];
const COVER_OPTIONS: CoverId[] = [
  'cover-concert',
  'cover-aperitivo',
  'cover-gallery',
];

function coverSource(value: string): ImageSourcePropType {
  switch (value) {
    case 'cover-concert':
      return require('../assets/images/cover-concert.jpg');
    case 'cover-gallery':
      return require('../assets/images/cover-gallery.jpg');
    case 'cover-aperitivo':
      return require('../assets/images/cover-aperitivo.jpg');
    default:
      return { uri: value };
  }
}

function makeDate(dayOffset: number, hour: number, minute = 0) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function createMockEvents(): SpotEvent[] {
  return [
    {
      id: 'spot-roma-01',
      title: 'Luci su Trastevere',
      place: 'Piazza di San Cosimato',
      category: 'Party',
      date: makeDate(0, 21, 30),
      image: 'cover-concert',
      description:
        'Una notte di musica elettronica, visual e incontri nel cuore di Trastevere. Ingresso fino a esaurimento posti.',
      lat: 41.8894,
      lng: 12.469,
    },
    {
      id: 'spot-roma-02',
      title: 'Suoni in terrazza',
      place: 'Terrazza del Pincio',
      category: 'Concerti',
      date: makeDate(1, 19, 0),
      image: 'cover-concert',
      description:
        'Live set al tramonto con una selezione di nuovi progetti indipendenti della scena romana.',
      lat: 41.9117,
      lng: 12.4768,
    },
    {
      id: 'spot-roma-03',
      title: 'Fuori formato',
      place: 'Galleria Margutta',
      category: 'Mostre',
      date: makeDate(2, 18, 30),
      image: 'cover-gallery',
      description:
        'Una collettiva di giovani artisti tra installazioni immersive, fotografia e pittura contemporanea.',
      lat: 41.9088,
      lng: 12.4802,
    },
    {
      id: 'spot-roma-04',
      title: 'Vino, vista, vinile',
      place: 'Lungotevere degli Anguillara',
      category: 'Aperitivi',
      date: makeDate(1, 18, 0),
      image: 'cover-aperitivo',
      description:
        'Vini naturali, piccoli piatti da condividere e dischi scelti per accompagnare l’ora blu.',
      lat: 41.8916,
      lng: 12.4708,
    },
    {
      id: 'spot-roma-05',
      title: 'Sotto le stelle',
      place: 'Ex Mattatoio, Testaccio',
      category: 'Party',
      date: makeDate(3, 22, 0),
      image: 'cover-concert',
      description:
        'Una pista all’aperto, ospiti a sorpresa e una selezione tutta da ballare fino a tardi.',
      lat: 41.8754,
      lng: 12.4778,
    },
    {
      id: 'spot-roma-06',
      title: 'Materia viva',
      place: 'MAXXI, Flaminio',
      category: 'Mostre',
      date: makeDate(4, 17, 30),
      image: 'cover-gallery',
      description:
        'Un percorso tra forme, materiali e architetture che cambiano il modo di guardare la città.',
      lat: 41.9281,
      lng: 12.4664,
    },
    {
      id: 'spot-roma-07',
      title: 'Aperitivo in giardino',
      place: 'Villa Torlonia',
      category: 'Aperitivi',
      date: makeDate(2, 18, 30),
      image: 'cover-aperitivo',
      description:
        'Un angolo verde in città, un calice fresco e una selezione di piccoli produttori locali.',
      lat: 41.9144,
      lng: 12.5104,
    },
    {
      id: 'spot-roma-08',
      title: 'Onde lunghe',
      place: 'Auditorium Parco della Musica',
      category: 'Concerti',
      date: makeDate(5, 20, 30),
      image: 'cover-concert',
      description:
        'Un concerto raccolto tra voci, chitarre e suoni elettronici, in una sala tutta da ascoltare.',
      lat: 41.9299,
      lng: 12.4768,
    },
    {
      id: 'spot-roma-09',
      title: 'Domenica in bottega',
      place: 'Monti, Via Urbana',
      category: 'Aperitivi',
      date: makeDate(3, 17, 0),
      image: 'cover-aperitivo',
      description:
        'Botteghe aperte, piccoli assaggi e un percorso libero tra le strade di Monti.',
      lat: 41.8964,
      lng: 12.4934,
    },
  ];
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase('it-IT')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (left: Date, right: Date) =>
    left.getDate() === right.getDate() &&
    left.getMonth() === right.getMonth() &&
    left.getFullYear() === right.getFullYear();
  const time = date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (sameDay(date, today)) return `Oggi · ${time}`;
  if (sameDay(date, tomorrow)) return `Domani · ${time}`;
  const day = date
    .toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .replace('.', '');
  return `${day} · ${time}`;
}

function formatEventDay(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (left: Date, right: Date) =>
    left.getDate() === right.getDate() &&
    left.getMonth() === right.getMonth() &&
    left.getFullYear() === right.getFullYear();
  if (sameDay(date, today)) return 'Oggi';
  if (sameDay(date, tomorrow)) return 'Domani';
  return date
    .toLocaleDateString('it-IT', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .replace('.', '');
}

function formatEventTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Orario da definire';
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseEventDate(value: string) {
  const normalized = value.trim();
  if (!normalized) return null;

  const italianDate = normalized.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/,
  );
  const parsed = italianDate
    ? new Date(
        Number(italianDate[3]),
        Number(italianDate[2]) - 1,
        Number(italianDate[1]),
        Number(italianDate[4]),
        Number(italianDate[5]),
      )
    : new Date(normalized);

  if (Number.isNaN(parsed.getTime())) return null;
  if (italianDate && parsed.getDate() !== Number(italianDate[1])) return null;
  if (parsed.getTime() <= Date.now()) return null;
  return parsed.toISOString();
}

function categoryColor(category: Category, colors: Palette) {
  switch (category) {
    case 'Party':
      return colors.party;
    case 'Concerti':
      return colors.concerti;
    case 'Mostre':
      return colors.mostre;
    case 'Aperitivi':
      return colors.aperitivi;
  }
}

function feedback() {
  void Haptics.selectionAsync().catch(() => undefined);
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    app: { flex: 1, backgroundColor: colors.background },
    page: {
      paddingHorizontal: 20,
      gap: 22,
    },
    scroll: { flex: 1 },
    centeredPage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      gap: 14,
      backgroundColor: colors.background,
    },
    loadingText: {
      color: colors.mutedForeground,
      fontSize: 14,
      fontFamily: 'Inter_500Medium',
    },
    topBar: {
      minHeight: 52,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoPlaceholder: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      overflow: 'hidden',
    },
    topBarAdminBadge: {
      position: 'absolute',
      left: 0,
      top: 15,
    },
    topBarAvatar: {
      position: 'absolute',
      right: 0,
      top: 7,
    },
    adminBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 7,
      marginLeft: 2,
    },
    adminBadgeText: {
      color: colors.accentForeground,
      fontFamily: 'Inter_700Bold',
      fontSize: 9,
      letterSpacing: 1.1,
    },
    avatarButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatarText: {
      color: colors.foreground,
      fontSize: 13,
      fontFamily: 'Inter_700Bold',
    },
    heroBlock: { gap: 8, paddingTop: 6 },
    eyebrow: {
      color: colors.magenta,
      fontSize: 10,
      letterSpacing: 2.2,
      fontFamily: 'Inter_700Bold',
      textTransform: 'uppercase',
    },
    heroTitle: {
      color: colors.foreground,
      fontSize: 40,
      lineHeight: 46,
      letterSpacing: 1.5,
      fontFamily: 'HeadingNow',
    },
    heroSub: {
      color: colors.mutedForeground,
      fontSize: 14,
      lineHeight: 21,
      fontFamily: 'Inter_400Regular',
      maxWidth: 320,
    },
    searchBox: {
      height: 50,
      borderRadius: 13,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      gap: 11,
    },
    searchInput: {
      flex: 1,
      color: colors.foreground,
      fontSize: 14,
      paddingVertical: 0,
      fontFamily: 'Inter_400Regular',
    },
    searchClear: { padding: 4 },
    sectionLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 11,
    },
    sectionTitle: {
      color: colors.foreground,
      fontSize: 23,
      lineHeight: 29,
      fontFamily: 'HeadingNow',
      letterSpacing: 1.25,
    },
    sectionHint: {
      color: colors.mutedForeground,
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
    },
    chipRow: { gap: 8, paddingRight: 20 },
    chip: {
      borderRadius: 11,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    chipText: {
      color: colors.mutedForeground,
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
    },
    eventList: { gap: 14 },
    eventCard: {
      overflow: 'hidden',
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    eventImageWrap: {
      width: '100%',
      height: 207,
      overflow: 'hidden',
      backgroundColor: colors.secondary,
    },
    eventImage: { width: '100%', height: '100%' },
    eventImageOverlay: {
      ...StyleSheet.absoluteFill,
      justifyContent: 'space-between',
      padding: 13,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    eventImageGradient: {
      ...StyleSheet.absoluteFill,
      top: '46%',
    },
    categoryTag: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: 'rgba(10,10,12,0.74)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.13)',
    },
    categoryTagText: {
      fontSize: 10,
      fontFamily: 'Inter_700Bold',
      letterSpacing: 0.4,
    },
    iconButton: {
      minWidth: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(10,10,12,0.74)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    imageActionColumn: { gap: 8 },
    eventInfo: { padding: 15, gap: 12 },
    eventDetailsButton: { gap: 10 },
    eventMetaStack: { gap: 6 },
    eventTitle: {
      color: colors.foreground,
      fontSize: 18,
      lineHeight: 24,
      fontFamily: 'HeadingNow',
      letterSpacing: 0.8,
    },
    eventMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    eventMetaText: {
      color: colors.mutedForeground,
      fontSize: 12,
      lineHeight: 17,
      fontFamily: 'Inter_500Medium',
      flexShrink: 1,
    },
    metaSeparator: {
      width: 3,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.mutedForeground,
    },
    eventDescription: {
      color: colors.mutedForeground,
      fontSize: 13,
      lineHeight: 20,
      fontFamily: 'Inter_400Regular',
    },
    reactionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    reactionButton: {
      minWidth: 58,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingHorizontal: 9,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reactionEmoji: { fontSize: 15, lineHeight: 18 },
    reactionCount: {
      color: colors.mutedForeground,
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
    },
    sectionBlock: { gap: 0 },
    navBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 64,
      paddingHorizontal: 13,
      paddingTop: 5,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-around',
      backgroundColor: '#0E0D11',
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    navItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 52,
      gap: 4,
    },
    navLabel: {
      fontSize: 9,
      lineHeight: 12,
      fontFamily: 'Inter_500Medium',
    },
    addNavItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 0,
    },
    addButton: {
      width: 48,
      height: 48,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.32,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 5 },
      elevation: 6,
    },
    navAddLabel: {
      marginTop: 3,
      color: colors.mutedForeground,
      fontSize: 9,
      fontFamily: 'Inter_500Medium',
    },
    storageNotice: {
      padding: 11,
      borderRadius: 12,
      backgroundColor: colors.accent,
      borderWidth: 1,
      borderColor: colors.border,
    },
    storageNoticeText: {
      color: colors.accentForeground,
      fontSize: 12,
      lineHeight: 17,
      fontFamily: 'Inter_500Medium',
    },
    emptyState: {
      minHeight: 230,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 26,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 11,
    },
    emptyTitle: {
      color: colors.foreground,
      fontSize: 16,
      fontFamily: 'Inter_700Bold',
      textAlign: 'center',
    },
    emptyText: {
      color: colors.mutedForeground,
      fontSize: 13,
      lineHeight: 19,
      fontFamily: 'Inter_400Regular',
      textAlign: 'center',
      maxWidth: 260,
    },
    pageHeading: { gap: 7 },
    pageTitle: {
      color: colors.foreground,
      fontSize: 35,
      lineHeight: 42,
      letterSpacing: 1.5,
      fontFamily: 'HeadingNow',
    },
    mapHeader: { gap: 7 },
    mapCard: {
      overflow: 'hidden',
      height: 460,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.mapBase,
    },
    mapTopOverlay: {
      position: 'absolute',
      top: 14,
      left: 14,
      right: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    mapLocationTag: {
      backgroundColor: 'rgba(10,10,12,0.85)',
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 11,
      paddingHorizontal: 12,
      paddingVertical: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    mapLocationText: {
      color: colors.foreground,
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
    },
    mapCountTag: {
      backgroundColor: colors.primary,
      borderRadius: 11,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    mapCountText: {
      color: colors.primaryForeground,
      fontSize: 10,
      fontFamily: 'Inter_700Bold',
    },
    mapHint: {
      position: 'absolute',
      bottom: 14,
      left: 14,
      right: 14,
      padding: 11,
      borderRadius: 12,
      backgroundColor: 'rgba(10,10,12,0.84)',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    mapHintText: {
      flex: 1,
      color: colors.mutedForeground,
      fontSize: 11,
      fontFamily: 'Inter_500Medium',
    },
    marker: {
      position: 'absolute',
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 2,
      borderColor: colors.foreground,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOpacity: 0.36,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    mapFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    mapFooterText: {
      color: colors.mutedForeground,
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
    },
    textButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 7,
      paddingHorizontal: 4,
    },
    textButtonLabel: {
      color: colors.accentForeground,
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
    },
    profileHero: {
      padding: 20,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 16,
    },
    profileIdentity: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    largeAvatar: {
      width: 58,
      height: 58,
      borderRadius: 20,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileName: {
      color: colors.foreground,
      fontSize: 17,
      fontFamily: 'Inter_700Bold',
    },
    profileEmail: {
      color: colors.mutedForeground,
      fontSize: 12,
      marginTop: 4,
      fontFamily: 'Inter_400Regular',
    },
    profileStats: {
      flexDirection: 'row',
      gap: 10,
    },
    adminEditorCard: {
      marginTop: 10,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    adminEditorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    adminEventList: {
      gap: 10,
    },
    adminEventRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondary,
    },
    adminEventInfo: {
      flex: 1,
      gap: 4,
    },
    adminEventTitle: {
      color: colors.foreground,
      fontSize: 13,
      fontFamily: 'Inter_700Bold',
    },
    adminEventMeta: {
      color: colors.mutedForeground,
      fontSize: 11,
      fontFamily: 'Inter_400Regular',
    },
    adminEventActions: {
      flexDirection: 'row',
      gap: 8,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.secondary,
      borderRadius: 13,
      padding: 13,
      gap: 4,
    },
    statValue: {
      color: colors.foreground,
      fontSize: 23,
      fontFamily: 'HeadingNow',
      letterSpacing: 1.2,
    },
    statLabel: {
      color: colors.mutedForeground,
      fontSize: 10,
      fontFamily: 'Inter_500Medium',
    },
    primaryButton: {
      minHeight: 50,
      borderRadius: 15,
      paddingHorizontal: 17,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 9,
      backgroundColor: colors.primary,
    },
    primaryButtonText: {
      color: colors.primaryForeground,
      fontSize: 14,
      fontFamily: 'Inter_700Bold',
    },
    dangerButton: {
      minHeight: 48,
      borderRadius: 15,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      backgroundColor: colors.destructive,
    },
    dangerButtonText: {
      color: '#ffffff',
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
    },
    secondaryButton: {
      minHeight: 48,
      borderRadius: 15,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.foreground,
      fontSize: 13,
      fontFamily: 'Inter_600SemiBold',
    },
    demoNote: {
      color: colors.mutedForeground,
      fontSize: 11,
      lineHeight: 17,
      fontFamily: 'Inter_400Regular',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'flex-end',
    },
    modalCloseLayer: {
      ...StyleSheet.absoluteFill,
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingTop: 11,
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.border,
      gap: 17,
    },
    sheetGrabber: {
      alignSelf: 'center',
      height: 4,
      width: 38,
      borderRadius: 3,
      backgroundColor: colors.border,
      marginBottom: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 14,
    },
    modalTitle: {
      color: colors.foreground,
      fontSize: 26,
      lineHeight: 33,
      fontFamily: 'HeadingNow',
      letterSpacing: 1.25,
    },
    modalSubTitle: {
      color: colors.mutedForeground,
      marginTop: 4,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: 'Inter_400Regular',
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 12,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    formLabel: {
      color: colors.foreground,
      fontSize: 12,
      fontFamily: 'Inter_600SemiBold',
      marginBottom: 8,
    },
    inputField: {
      minHeight: 49,
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 14,
      color: colors.foreground,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      fontFamily: 'Inter_400Regular',
    },
    textArea: {
      minHeight: 84,
      textAlignVertical: 'top',
    },
    formGroup: { gap: 0 },
    formError: {
      color: colors.destructive,
      fontSize: 12,
      fontFamily: 'Inter_500Medium',
    },
    categoryOptionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryOption: {
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    coverRow: { gap: 9, paddingRight: 20 },
    coverOption: {
      width: 88,
      height: 68,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
      backgroundColor: colors.secondary,
    },
    coverImage: { width: '100%', height: '100%' },
    coverPickButton: {
      height: 44,
      paddingHorizontal: 12,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    coverPickText: {
      color: colors.foreground,
      fontSize: 11,
      fontFamily: 'Inter_600SemiBold',
    },
    loginModalBody: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    loginCard: {
      width: '100%',
      maxWidth: 430,
      alignSelf: 'center',
      borderRadius: 25,
      padding: 22,
      gap: 16,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    loginMark: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loginDemoCard: {
      backgroundColor: colors.card,
      borderRadius: 13,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
    },
    loginDemoText: {
      flex: 1,
      color: colors.mutedForeground,
      fontSize: 11,
      lineHeight: 17,
      fontFamily: 'Inter_400Regular',
    },
    detailSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    detailImageWrap: {
      height: 220,
      backgroundColor: colors.secondary,
    },
    detailImage: { width: '100%', height: '100%' },
    detailImageTools: {
      position: 'absolute',
      left: 15,
      right: 15,
      top: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    detailBody: { padding: 20, gap: 15 },
    detailTitle: {
      color: colors.foreground,
      fontSize: 30,
      lineHeight: 37,
      letterSpacing: 1.5,
      fontFamily: 'HeadingNow',
    },
    detailActionRow: { flexDirection: 'row', gap: 10 },
    detailAction: { flex: 1 },
    categoryDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
  });
}

type EventCardProps = {
  item: SpotEvent;
  colors: Palette;
  styles: ReturnType<typeof makeStyles>;
  isSaved: boolean;
  isAdmin: boolean;
  reactions: Partial<Record<ReactionEmoji, string[]>>;
  currentUserEmail: string | null;
  onOpen: () => void;
  onSave: () => void;
  onEdit: () => void;
  onReact: (emoji: ReactionEmoji) => void;
};

function EventCard({
  item,
  colors,
  styles,
  isSaved,
  isAdmin,
  reactions,
  currentUserEmail,
  onOpen,
  onSave,
  onEdit,
  onReact,
}: EventCardProps) {
  const accent = categoryColor(item.category, colors);
  return (
    <View style={styles.eventCard} testID={`event-card-${item.id}`}>
      <Pressable
        style={({ pressed }) => [
          styles.eventImageWrap,
          pressed && { opacity: 0.9 },
        ]}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`Apri ${item.title}`}
      >
        <Image
          source={coverSource(item.image)}
          style={styles.eventImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,10,12,0.12)']}
          style={styles.eventImageGradient}
          pointerEvents="none"
        />
      </Pressable>
      <View style={styles.eventImageOverlay} pointerEvents="box-none">
          <View style={styles.categoryTag}>
            <Text style={[styles.categoryTagText, { color: accent }]}>
              {item.category.toLocaleUpperCase('it-IT')}
            </Text>
          </View>
          <View style={styles.imageActionColumn}>
            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                pressed && { opacity: 0.72 },
              ]}
              onPress={(event) => {
                event.stopPropagation();
                onSave();
              }}
              accessibilityRole="button"
              accessibilityLabel={
                isSaved
                  ? `Rimuovi ${item.title} dai salvati`
                  : `Salva ${item.title}`
              }
              testID={`save-${item.id}`}
            >
              <Feather
                name={isSaved ? 'bookmark' : 'bookmark'}
                size={16}
                color={isSaved ? colors.accentForeground : colors.foreground}
                fill={isSaved ? colors.accentForeground : 'transparent'}
              />
            </Pressable>
            {isAdmin && (
              <Pressable
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && { opacity: 0.72 },
                ]}
                onPress={(event) => {
                  event.stopPropagation();
                  onEdit();
                }}
                accessibilityRole="button"
                accessibilityLabel={`Modifica ${item.title}`}
                testID={`edit-${item.id}`}
              >
                <Feather name="edit-2" size={15} color={colors.foreground} />
              </Pressable>
            )}
          </View>
      </View>
      <View style={styles.eventInfo}>
        <Pressable
          style={({ pressed }) => [
            styles.eventDetailsButton,
            pressed && { opacity: 0.75 },
          ]}
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`Apri dettagli di ${item.title}`}
        >
          <Text style={styles.eventTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.eventMetaStack}>
            <View style={styles.eventMetaRow}>
              <Feather name="calendar" size={13} color={colors.primary} />
              <Text style={styles.eventMetaText}>
                {formatEventDay(item.date)}
              </Text>
              <View style={styles.metaSeparator} />
              <Feather name="clock" size={13} color={colors.primary} />
              <Text style={styles.eventMetaText}>
                {formatEventTime(item.date)}
              </Text>
            </View>
            <View style={styles.eventMetaRow}>
              <Feather
                name="map-pin"
                size={13}
                color={colors.mutedForeground}
              />
              <Text style={styles.eventMetaText}>{item.place}</Text>
            </View>
          </View>
          <Text style={styles.eventDescription} numberOfLines={3}>
            {item.description}
          </Text>
        </Pressable>
        <View style={styles.reactionRow}>
          {REACTION_EMOJIS.map((emoji, index) => {
            const users = reactions[emoji] ?? [];
            const count = users.length;
            const isSelected = Boolean(
              currentUserEmail && users.includes(currentUserEmail),
            );
            return (
              <Pressable
                key={emoji}
                style={({ pressed }) => [
                  styles.reactionButton,
                  isSelected && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  },
                  pressed && { opacity: 0.72 },
                ]}
                onPress={() => onReact(emoji)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${isSelected ? 'Rimuovi' : 'Aggiungi'} reazione ${emoji}. ${count} ${count === 1 ? 'reazione' : 'reazioni'}`}
                accessibilityHint={
                  currentUserEmail
                    ? undefined
                    : 'Accedi per aggiungere la tua reazione.'
                }
                testID={`reaction-${item.id}-${index}`}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                <Text
                  style={[
                    styles.reactionCount,
                    isSelected && { color: colors.primaryForeground },
                  ]}
                >
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

type CategoryChipProps = {
  label: CategoryFilter;
  active: boolean;
  colors: Palette;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
};

function CategoryChip({
  label,
  active,
  colors,
  styles,
  onPress,
}: CategoryChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        active && {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        pressed && { opacity: 0.75 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      testID={`category-${normalize(label)}`}
    >
      <Text
        style={[
          styles.chipText,
          active && { color: colors.foreground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function SpotApp() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const contentWidth = Math.min(windowWidth - 40, 500);
  const [activeScreen, setActiveScreen] = useState<Screen>('explore');
  const [events, setEvents] = useState<SpotEvent[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [user, setUser] = useState<DemoUser | null>(null);
  const [reactions, setReactions] = useState<ReactionsByEvent>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('Tutti');
  const [modal, setModal] = useState<ModalType>(null);
  const [loginIntent, setLoginIntent] = useState<
    'create' | 'profile' | 'reaction'
  >('create');
  const [loginEmail, setLoginEmail] = useState('');
  const [pendingReaction, setPendingReaction] = useState<{
    eventId: string;
    emoji: ReactionEmoji;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminEditorOpen, setAdminEditorOpen] = useState(false);
  const [formDraft, setFormDraft] = useState<EventDraft>({
    title: '',
    place: '',
    category: 'Party',
    date: '',
    image: 'cover-concert',
    description: '',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!isMounted) return;
        if (raw) {
          const stored = JSON.parse(raw) as StoredState;
          setEvents(
            Array.isArray(stored.events) && stored.events.length > 0
              ? stored.events
              : createMockEvents(),
          );
          setSavedIds(Array.isArray(stored.savedIds) ? stored.savedIds : []);
          setUser(stored.user ?? null);
          setReactions(stored.reactions ?? {});
        } else {
          setEvents(createMockEvents());
        }
      } catch {
        if (!isMounted) return;
        setEvents(createMockEvents());
        setStorageError(true);
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };
    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const save = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ events, savedIds, user, reactions }),
        );
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
    };
    void save();
  }, [events, isLoaded, reactions, savedIds, user]);

  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);
  const matchingEvents = useMemo(() => {
    const query = normalize(search.trim());
    return events.filter((item) => {
      const matchesCategory = category === 'Tutti' || item.category === category;
      const matchesSearch =
        !query ||
        normalize(`${item.title} ${item.category} ${item.place}`).includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [category, events, search]);
  const savedEvents = useMemo(
    () => events.filter((item) => savedSet.has(item.id)),
    [events, savedSet],
  );
  const selectedEvent = events.find((item) => item.id === selectedId) ?? null;

  const openCreate = () => {
    feedback();
    setFormError('');
    setPendingReaction(null);
    if (user) {
      setEditingId(null);
      setFormDraft({
        title: '',
        place: '',
        category: 'Party',
        date: '',
        image: 'cover-concert',
        description: '',
      });
      setModal('form');
      return;
    }
    setLoginIntent('create');
    setModal('login');
  };

  const openLogin = () => {
    setPendingReaction(null);
    setLoginIntent('profile');
    setModal('login');
  };

  const closeLogin = () => {
    setModal(null);
    setFormError('');
    setPendingReaction(null);
  };

  const openDetail = (eventId: string) => {
    setSelectedId(eventId);
    setModal('detail');
  };

  const openEdit = (item: SpotEvent) => {
    if (!user?.isAdmin) return;
    setEditingId(item.id);
    setFormDraft({
      title: item.title,
      place: item.place,
      category: item.category,
      date: item.date,
      image: item.image,
      description: item.description,
    });
    setFormError('');
    setModal('form');
  };

  const toggleSaved = (eventId: string) => {
    feedback();
    setSavedIds((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [eventId, ...current],
    );
  };

  const toggleEventReaction = (
    eventId: string,
    emoji: ReactionEmoji,
    email: string,
  ) => {
    const normalizedEmail = email.trim().toLocaleLowerCase('it-IT');
    setReactions((current) => {
      const eventReactions = current[eventId] ?? {};
      const reactingUsers = eventReactions[emoji] ?? [];
      const nextUsers = reactingUsers.includes(normalizedEmail)
        ? reactingUsers.filter((reactingUser) => reactingUser !== normalizedEmail)
        : [...reactingUsers, normalizedEmail];
      return {
        ...current,
        [eventId]: {
          ...eventReactions,
          [emoji]: nextUsers,
        },
      };
    });
  };

  const reactToEvent = (eventId: string, emoji: ReactionEmoji) => {
    feedback();
    if (!user) {
      setPendingReaction({ eventId, emoji });
      setLoginIntent('reaction');
      setFormError('');
      setModal('login');
      return;
    }
    toggleEventReaction(eventId, emoji, user.email);
  };

  const completeLogin = () => {
    const normalizedEmail = loginEmail.trim().toLocaleLowerCase('it-IT');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFormError('Inserisci un indirizzo email valido.');
      return;
    }
    const demoUser: DemoUser = {
      email: normalizedEmail,
      isAdmin: normalizedEmail === 'admin@spot.it',
    };
    setUser(demoUser);
    setFormError('');
    setLoginEmail('');
    setModal(null);
    feedback();
    if (loginIntent === 'reaction' && pendingReaction) {
      toggleEventReaction(
        pendingReaction.eventId,
        pendingReaction.emoji,
        normalizedEmail,
      );
    }
    setPendingReaction(null);
    if (loginIntent === 'create') {
      setTimeout(() => {
        setEditingId(null);
        setFormDraft({
          title: '',
          place: '',
          category: 'Party',
          date: '',
          image: 'cover-concert',
          description: '',
        });
        setModal('form');
      }, 240);
    }
  };

  const chooseImage = async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Accesso alle foto',
            permission.canAskAgain
              ? 'Consenti l’accesso alla galleria per scegliere una copertina.'
              : 'L’accesso alle foto è disattivato. Puoi abilitarlo dalle impostazioni.',
            [
              { text: 'Annulla', style: 'cancel' },
              ...(!permission.canAskAgain
                ? [
                    {
                      text: 'Impostazioni',
                      onPress: () => {
                        void Linking.openSettings().catch(() => undefined);
                      },
                    },
                  ]
                : []),
            ],
          );
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.84,
      });
      const uri = result.assets?.[0]?.uri;
      if (!result.canceled && uri) {
        setFormDraft((current) => ({ ...current, image: uri }));
      }
    } catch {
      Alert.alert(
        'Immagine non disponibile',
        'Non è stato possibile aprire la galleria. Scegli una copertina SPOT.',
      );
    }
  };

  const deleteEvent = (eventId: string) => {
    Alert.alert(
      'Elimina evento',
      'Questa azione rimuove l’evento dal sito. Vuoi continuare?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: () => {
            setEvents((current) => current.filter((item) => item.id !== eventId));
            if (selectedId === eventId) setSelectedId(null);
            if (editingId === eventId) {
              setEditingId(null);
            }
            setFormError('');
            setModal(null);
            setAdminEditorOpen(false);
            Keyboard.dismiss();
            feedback();
          },
        },
      ],
    );
  };

  const submitEvent = () => {
    const title = formDraft.title.trim();
    const place = formDraft.place.trim();
    const date = parseEventDate(formDraft.date);
    if (!title || !place || !date) {
      setFormError(
        'Inserisci titolo e luogo, oltre a una data futura nel formato gg/mm/aaaa hh:mm.',
      );
      return;
    }
    if (editingId && !user?.isAdmin) {
      setFormError('Solo un admin può modificare gli eventi.');
      return;
    }

    if (editingId) {
      setEvents((current) =>
        current.map((item) =>
          item.id === editingId
            ? { ...item, ...formDraft, title, place, date }
            : item,
        ),
      );
    } else {
      const newEvent: SpotEvent = {
        id: `spot-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 8)}`,
        ...formDraft,
        title,
        place,
        date,
        description:
          formDraft.description.trim() ||
          'Un nuovo appuntamento da scoprire in città.',
        lat: 41.88 + Math.random() * 0.047,
        lng: 12.455 + Math.random() * 0.075,
      };
      setEvents((current) => [newEvent, ...current]);
      setActiveScreen('explore');
      setSearch('');
      setCategory('Tutti');
    }
    setFormError('');
    setModal(null);
    Keyboard.dismiss();
    feedback();
  };

  const navItems: { id: Screen; label: string; icon: string }[] = [
    { id: 'explore', label: 'Esplora', icon: 'compass' },
    { id: 'map', label: 'Mappa', icon: 'map' },
    { id: 'saved', label: 'Salvati', icon: 'bookmark' },
    { id: 'profile', label: 'Profilo', icon: 'user' },
  ];

  const pageInsets = {
    paddingTop: Platform.OS === 'web' ? 67 : insets.top + 8,
    paddingBottom: Platform.OS === 'web' ? 104 : 100 + insets.bottom,
    width: Platform.OS === 'web' ? '100%' as const : undefined,
    maxWidth: Platform.OS === 'web' ? 540 : undefined,
    alignSelf: Platform.OS === 'web' ? 'center' as const : undefined,
  };

  const renderStorageNotice = () =>
    storageError ? (
      <View style={styles.storageNotice}>
        <Text style={styles.storageNoticeText}>
          Salvataggio locale non disponibile: le modifiche resteranno in questa
          sessione.
        </Text>
      </View>
    ) : null;

  const renderEventList = (items: SpotEvent[], emptyTitle: string, emptyText: string) =>
    items.length ? (
      <View style={styles.eventList}>
        {items.map((item) => (
          <EventCard
            key={item.id}
            item={item}
            colors={colors}
            styles={styles}
            isSaved={savedSet.has(item.id)}
            isAdmin={Boolean(user?.isAdmin)}
            reactions={reactions[item.id] ?? {}}
            currentUserEmail={user?.email ?? null}
            onOpen={() => openDetail(item.id)}
            onSave={() => toggleSaved(item.id)}
            onEdit={() => openEdit(item)}
            onReact={(emoji) => reactToEvent(item.id, emoji)}
          />
        ))}
      </View>
    ) : (
      <View style={styles.emptyState}>
        <Feather
          name={activeScreen === 'saved' ? 'bookmark' : 'search'}
          size={24}
          color={colors.primary}
        />
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );

  const renderTopBar = () => (
    <View style={styles.topBar}>
      {user?.isAdmin && (
        <View style={[styles.adminBadge, styles.topBarAdminBadge]}>
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      )}
      <View
        style={styles.logoPlaceholder}
        accessible
        accessibilityRole="image"
        accessibilityLabel="Spazio per il logo SPOT"
      />
      <Pressable
        style={({ pressed }) => [
          styles.avatarButton,
          styles.topBarAvatar,
          pressed && { opacity: 0.7 },
        ]}
        onPress={() => setActiveScreen('profile')}
        accessibilityRole="button"
        accessibilityLabel="Apri il profilo"
        testID="profile-shortcut"
      >
        {user ? (
          <Text style={styles.avatarText}>
            {user.email.slice(0, 1).toLocaleUpperCase('it-IT')}
          </Text>
        ) : (
          <Feather name="user" size={16} color={colors.foreground} />
        )}
      </Pressable>
    </View>
  );

  const renderExplore = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.page, pageInsets]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      scrollEnabled={events.length > 0}
    >
      {renderTopBar()}
      {renderStorageNotice()}
      <View style={styles.heroBlock}>
        <Text style={styles.eyebrow}>ROMA · LA CITTÀ, ADESSO</Text>
        <Text style={styles.heroTitle}>La serata{"\n"}inizia qui.</Text>
        <Text style={styles.heroSub}>
          Posti da scoprire, persone da incontrare, storie da portare a casa.
        </Text>
      </View>
      <View style={styles.searchBox}>
        <Feather name="search" size={18} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Cerca evento, genere o luogo"
          placeholderTextColor={colors.mutedForeground}
          style={styles.searchInput}
          returnKeyType="search"
          accessibilityLabel="Cerca eventi"
          testID="event-search"
        />
        {search.length > 0 && (
          <Pressable
            style={styles.searchClear}
            onPress={() => setSearch('')}
            accessibilityRole="button"
            accessibilityLabel="Cancella ricerca"
          >
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>
      <View style={styles.sectionBlock}>
        <View style={styles.sectionLabelRow}>
          <Text style={styles.sectionTitle}>Esplora</Text>
          <Text style={styles.sectionHint}>
            {matchingEvents.length} {matchingEvents.length === 1 ? 'evento' : 'eventi'}
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {(['Tutti', ...CATEGORIES] as CategoryFilter[]).map((item) => (
            <CategoryChip
              key={item}
              label={item}
              active={category === item}
              colors={colors}
              styles={styles}
              onPress={() => {
                setCategory(item);
                feedback();
              }}
            />
          ))}
        </ScrollView>
      </View>
      {renderEventList(
        matchingEvents,
        'Nessun evento trovato',
        'Prova a cambiare la ricerca o a scegliere un’altra categoria.',
      )}
      <View style={{ height: 3 }} />
    </ScrollView>
  );

  const renderMap = () => {
    const mapEvents = category === 'Tutti'
      ? events
      : events.filter((item) => item.category === category);
    const mapHeight = 460;
    const mapWidth = contentWidth;
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.page, pageInsets]}
        showsVerticalScrollIndicator={false}
        scrollEnabled
      >
        <View style={styles.mapHeader}>
          <Text style={[styles.eyebrow, { fontFamily: 'Inter_500Medium' }]}>
            ESPLORA DA VICINO
          </Text>
          <Text style={styles.pageTitle}>La mappa</Text>
          <Text style={styles.heroSub}>
            Ogni punto è una buona scusa per uscire.
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {(['Tutti', ...CATEGORIES] as CategoryFilter[]).map((item) => (
            <CategoryChip
              key={`map-${item}`}
              label={item}
              active={category === item}
              colors={colors}
              styles={styles}
              onPress={() => {
                setCategory(item);
                feedback();
              }}
            />
          ))}
        </ScrollView>
        <View style={[styles.mapCard, { width: mapWidth, height: mapHeight }]}>
          <Svg
            width={mapWidth}
            height={mapHeight}
            viewBox="0 0 360 460"
            preserveAspectRatio="none"
          >
            <Rect x="0" y="0" width="360" height="460" fill={colors.mapBase} />
            <Path
              d="M-20 390 C45 345 55 300 110 282 C150 268 150 215 197 192 C243 169 244 111 305 97 C330 91 350 64 380 40"
              fill="none"
              stroke={colors.mapRoad}
              strokeWidth="31"
              opacity="0.65"
            />
            <Path
              d="M-20 390 C45 345 55 300 110 282 C150 268 150 215 197 192 C243 169 244 111 305 97 C330 91 350 64 380 40"
              fill="none"
              stroke={colors.background}
              strokeWidth="2"
              opacity="0.75"
            />
            <Path
              d="M-20 95 C50 124 75 104 118 140 C159 174 180 155 220 182 C271 216 291 247 383 252"
              fill="none"
              stroke={colors.mapRoad}
              strokeWidth="17"
              opacity="0.8"
            />
            <Path
              d="M40 -20 C57 66 39 97 69 162 C94 216 78 272 112 329 C127 354 144 409 147 480"
              fill="none"
              stroke={colors.mapRoad}
              strokeWidth="11"
              opacity="0.78"
            />
            <Path
              d="M252 -20 C232 49 255 87 230 137 C207 181 238 238 220 277 C197 328 217 383 188 480"
              fill="none"
              stroke={colors.mapRoad}
              strokeWidth="12"
              opacity="0.72"
            />
            <Path
              d="M-10 205 C64 191 113 215 163 207 C224 197 255 222 373 202"
              fill="none"
              stroke={colors.mapRoad}
              strokeWidth="8"
              opacity="0.74"
            />
            <Path
              d="M-10 310 C49 293 96 319 152 301 C217 281 272 315 375 290"
              fill="none"
              stroke={colors.mapRoad}
              strokeWidth="9"
              opacity="0.72"
            />
            <Path
              d="M88 0 C103 44 103 88 130 115 C161 145 158 176 177 212 C195 248 179 291 197 339 C208 369 203 407 226 465"
              fill="none"
              stroke={colors.mostre}
              strokeWidth="7"
              opacity="0.32"
            />
            <Path
              d="M276 283 C302 258 334 264 353 294 C365 315 351 343 323 348 C297 352 276 329 276 283Z"
              fill={colors.success}
              opacity="0.11"
            />
            <Circle cx="91" cy="103" r="21" fill={colors.aperitivi} opacity="0.06" />
            <SvgText
              x="228"
              y="77"
              fill={colors.mutedForeground}
              fontSize="9"
              letterSpacing="2"
              opacity="0.85"
            >
              PRATI
            </SvgText>
            <SvgText
              x="125"
              y="181"
              fill={colors.mutedForeground}
              fontSize="9"
              letterSpacing="2"
              opacity="0.85"
            >
              CENTRO
            </SvgText>
            <SvgText
              x="44"
              y="272"
              fill={colors.mutedForeground}
              fontSize="9"
              letterSpacing="1.5"
              opacity="0.85"
            >
              TRASTEVERE
            </SvgText>
            <SvgText
              x="237"
              y="335"
              fill={colors.mutedForeground}
              fontSize="9"
              letterSpacing="2"
              opacity="0.85"
            >
              TESTACCIO
            </SvgText>
          </Svg>
          {mapEvents.map((item) => {
            const xRatio = Math.max(0.07, Math.min(0.93, (item.lng - 12.45) / 0.12));
            const yRatio = Math.max(0.1, Math.min(0.91, 1 - (item.lat - 41.87) / 0.08));
            return (
              <Pressable
                key={`pin-${item.id}`}
                style={({ pressed }) => [
                  styles.marker,
                  {
                    left: xRatio * mapWidth - 19,
                    top: yRatio * mapHeight - 19,
                    backgroundColor: categoryColor(item.category, colors),
                  },
                  pressed && { transform: [{ scale: 1.13 }] },
                ]}
                onPress={() => openDetail(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Apri ${item.title} sulla mappa`}
                testID={`map-pin-${item.id}`}
              >
                <Feather
                  name={item.category === 'Aperitivi' ? 'coffee' : item.category === 'Mostre' ? 'eye' : item.category === 'Concerti' ? 'music' : 'zap'}
                  size={15}
                  color={colors.background}
                />
              </Pressable>
            );
          })}
          <View style={styles.mapTopOverlay} pointerEvents="box-none">
            <View style={styles.mapCountTag}>
              <Text style={styles.mapCountText}>
                {mapEvents.length} {mapEvents.length === 1 ? 'EVENTO' : 'EVENTI'}
              </Text>
            </View>
          </View>
          <View style={styles.mapHint} pointerEvents="none">
            <Feather name="info" size={14} color={colors.accentForeground} />
            <Text style={styles.mapHintText}>
              Tocca un punto per vedere i dettagli dell’evento.
            </Text>
          </View>
        </View>
        <View style={styles.mapFooter}>
          <Text style={styles.mapFooterText}>Posizioni demo nel centro di Roma</Text>
          <Pressable
            style={styles.textButton}
            onPress={() => setActiveScreen('explore')}
            accessibilityRole="button"
            testID="map-to-explore"
          >
            <Text style={styles.textButtonLabel}>Vedi lista</Text>
            <Feather name="arrow-up-right" size={14} color={colors.accentForeground} />
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  const renderSaved = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.page, pageInsets]}
      showsVerticalScrollIndicator={false}
      scrollEnabled
    >
      {renderTopBar()}
      {renderStorageNotice()}
      <View style={styles.pageHeading}>
        <Text style={styles.eyebrow}>LA TUA PROSSIMA USCITA</Text>
        <Text style={styles.pageTitle}>Salvati</Text>
        <Text style={styles.heroSub}>
          {savedEvents.length
            ? 'Tutto quello che vuoi tenere a portata di mano.'
            : 'Raccogli qui gli eventi che non vuoi perdere.'}
        </Text>
      </View>
      {renderEventList(
        savedEvents,
        'La lista è ancora vuota',
        'Tocca il segnalibro su un evento per ritrovarlo qui.',
      )}
    </ScrollView>
  );

  const renderProfile = () => (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.page, pageInsets]}
      showsVerticalScrollIndicator={false}
    >
      {renderTopBar()}
      {renderStorageNotice()}
      <View style={styles.pageHeading}>
        <Text style={styles.eyebrow}>IL TUO SPAZIO</Text>
        <Text style={styles.pageTitle}>Profilo</Text>
      </View>
      <View style={styles.profileHero}>
        <View style={styles.profileIdentity}>
          <View style={styles.largeAvatar}>
            {user ? (
              <Text style={styles.avatarText}>
                {user.email.slice(0, 1).toLocaleUpperCase('it-IT')}
              </Text>
            ) : (
              <Feather name="user" size={23} color={colors.accentForeground} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>
              {user ? (user.isAdmin ? 'Admin SPOT' : 'Esploratore') : 'Ospite'}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email ?? 'Accedi per creare un evento'}
            </Text>
          </View>
          {user?.isAdmin && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          )}
        </View>
        <View style={styles.categoryDivider} />
        <View style={styles.profileStats}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{savedEvents.length}</Text>
            <Text style={styles.statLabel}>SALVATI</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{events.length}</Text>
            <Text style={styles.statLabel}>IN CITTÀ</Text>
          </View>
        </View>
      </View>
      {user?.isAdmin && (
        <View style={styles.adminEditorCard}>
          <View style={styles.adminEditorHeader}>
            <Text style={styles.sectionTitle}>Gestisci eventi</Text>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && { opacity: 0.75 },
              ]}
              onPress={() => setAdminEditorOpen(true)}
              accessibilityRole="button"
              testID="admin-open-editor"
            >
              <Feather name="sliders" size={15} color={colors.foreground} />
              <Text style={styles.secondaryButtonText}>Apri editor</Text>
            </Pressable>
          </View>
        </View>
      )}
      {user ? (
        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && { opacity: 0.75 },
          ]}
          onPress={() => {
            setUser(null);
            setSavedIds([]);
            setAdminEditorOpen(false);
            feedback();
          }}
          accessibilityRole="button"
          testID="logout-button"
        >
          <Feather name="log-out" size={16} color={colors.foreground} />
          <Text style={styles.secondaryButtonText}>Esci dal profilo demo</Text>
        </Pressable>
      ) : (
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && { opacity: 0.8 },
          ]}
          onPress={openLogin}
          accessibilityRole="button"
          testID="profile-login-button"
        >
          <Feather name="log-in" size={16} color={colors.primaryForeground} />
          <Text style={styles.primaryButtonText}>Accedi in modalità demo</Text>
        </Pressable>
      )}
      <Text style={styles.demoNote}>
        L’accesso è dimostrativo e salvato solo su questo dispositivo. Per provare
        i controlli admin usa admin@spot.it.
      </Text>
    </ScrollView>
  );

  const navHeight = Platform.OS === 'web' ? 84 : 64 + insets.bottom;
  const navBottomInset = Platform.OS === 'web' ? 0 : insets.bottom;

  if (!isLoaded) {
    return (
      <View style={[styles.centeredPage, { paddingTop: insets.top }]}>
        <View
          style={styles.logoPlaceholder}
          accessible
          accessibilityRole="image"
          accessibilityLabel="Spazio per il logo SPOT"
        />
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Prepariamo la città…</Text>
      </View>
    );
  }

  return (
    <View style={styles.app}>
      {activeScreen === 'explore' && renderExplore()}
      {activeScreen === 'map' && renderMap()}
      {activeScreen === 'saved' && renderSaved()}
      {activeScreen === 'profile' && renderProfile()}

      <View
        style={[
          styles.navBar,
          { height: navHeight, paddingBottom: navBottomInset },
          Platform.OS === 'web' && { paddingTop: 7 },
        ]}
        accessibilityRole="tablist"
      >
        {navItems.slice(0, 2).map((item) => {
          const active = activeScreen === item.id;
          return (
            <Pressable
              key={item.id}
              style={styles.navItem}
              onPress={() => {
                setActiveScreen(item.id);
                feedback();
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              testID={`tab-${item.id}`}
            >
              <Feather
                name={item.icon as React.ComponentProps<typeof Feather>['name']}
                size={19}
                 color={active ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.navLabel,
                   { color: active ? colors.primary : colors.mutedForeground },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          style={styles.addNavItem}
          onPress={openCreate}
          accessibilityRole="button"
          accessibilityLabel={user ? 'Crea un evento' : 'Accedi per creare un evento'}
          testID="tab-add"
        >
          <View style={styles.addButton}>
            <Feather name="plus" size={24} color={colors.primaryForeground} />
          </View>
          <Text style={styles.navAddLabel}>Crea</Text>
        </Pressable>
        {navItems.slice(2).map((item) => {
          const active = activeScreen === item.id;
          return (
            <Pressable
              key={item.id}
              style={styles.navItem}
              onPress={() => {
                setActiveScreen(item.id);
                feedback();
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              testID={`tab-${item.id}`}
            >
              <Feather
                name={item.icon as React.ComponentProps<typeof Feather>['name']}
                size={19}
                 color={active ? colors.primary : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.navLabel,
                   { color: active ? colors.primary : colors.mutedForeground },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Modal
        visible={modal === 'login'}
        transparent
        animationType="fade"
        onRequestClose={closeLogin}
      >
        <View style={[styles.modalBackdrop, { justifyContent: 'center' }]}>
          <Pressable
            style={styles.modalCloseLayer}
            onPress={closeLogin}
            accessibilityLabel="Chiudi accesso"
          />
          <KeyboardAwareScrollViewCompat
            contentContainerStyle={[
              styles.loginModalBody,
              Platform.OS === 'web' && { paddingTop: 67, paddingBottom: 34 },
            ]}
            keyboardShouldPersistTaps="handled"
            bottomOffset={24}
          >
            <View style={styles.loginCard}>
              <View style={styles.modalHeader}>
                <View style={styles.loginMark}>
                  <Feather name="map-pin" size={22} color={colors.accentForeground} />
                </View>
                <Pressable
                  style={styles.closeButton}
                  onPress={closeLogin}
                  accessibilityRole="button"
                  accessibilityLabel="Chiudi"
                >
                  <Feather name="x" size={17} color={colors.foreground} />
                </Pressable>
              </View>
              <View>
                <Text style={styles.modalTitle}>Entra in SPOT</Text>
                <Text style={styles.modalSubTitle}>
                  {loginIntent === 'reaction'
                    ? 'Accedi per aggiungere la tua reazione a questo evento.'
                    : loginIntent === 'create'
                      ? 'Accedi per aggiungere un evento alla città.'
                      : 'Accedi per salvare eventi e personalizzare il tuo profilo.'}
                </Text>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  value={loginEmail}
                  onChangeText={(value) => {
                    setLoginEmail(value);
                    setFormError('');
                  }}
                  placeholder="nome@email.it"
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={completeLogin}
                  style={styles.inputField}
                  accessibilityLabel="Email demo"
                  testID="login-email"
                />
              </View>
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}
              <View style={styles.loginDemoCard}>
                <Feather name="info" size={14} color={colors.accentForeground} />
                <Text style={styles.loginDemoText}>
                  Accesso dimostrativo, senza account reale. Profilo e reazioni
                  sono salvati solo su questo dispositivo. Per testare gli
                  strumenti admin inserisci admin@spot.it.
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={completeLogin}
                accessibilityRole="button"
                testID="login-submit"
              >
                <Text style={styles.primaryButtonText}>Continua</Text>
                <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
              </Pressable>
            </View>
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>

      <Modal
        visible={adminEditorOpen && Boolean(user?.isAdmin)}
        transparent
        animationType="slide"
        onRequestClose={() => setAdminEditorOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalCloseLayer}
            onPress={() => setAdminEditorOpen(false)}
            accessibilityLabel="Chiudi editor admin"
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom) }]}> 
            <View style={styles.sheetGrabber} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Editor eventi</Text>
                <Text style={styles.modalSubTitle}>Modifica o elimina gli eventi dal sito.</Text>
              </View>
              <Pressable
                style={styles.closeButton}
                onPress={() => setAdminEditorOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Chiudi"
              >
                <Feather name="x" size={17} color={colors.foreground} />
              </Pressable>
            </View>
            <View style={styles.adminEventList}>
              {events.map((item) => (
                <View key={item.id} style={styles.adminEventRow}>
                  <View style={styles.adminEventInfo}>
                    <Text style={styles.adminEventTitle}>{item.title}</Text>
                    <Text style={styles.adminEventMeta}>{formatDate(item.date)} · {item.place}</Text>
                  </View>
                  <View style={styles.adminEventActions}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.secondaryButton,
                        { minHeight: 36, paddingHorizontal: 10 },
                        pressed && { opacity: 0.75 },
                      ]}
                      onPress={() => {
                        setAdminEditorOpen(false);
                        openEdit(item);
                      }}
                      accessibilityRole="button"
                    >
                      <Feather name="edit-2" size={14} color={colors.foreground} />
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.dangerButton,
                        { minHeight: 36, paddingHorizontal: 10 },
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => deleteEvent(item.id)}
                      accessibilityRole="button"
                    >
                      <Feather name="trash-2" size={14} color="#ffffff" />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modal === 'form'}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setModal(null);
          setFormError('');
          Keyboard.dismiss();
        }}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalCloseLayer}
            onPress={() => {
              setModal(null);
              setFormError('');
              Keyboard.dismiss();
            }}
            accessibilityLabel="Chiudi modulo evento"
          />
          <KeyboardAwareScrollViewCompat
            style={{ maxHeight: '94%' }}
            contentContainerStyle={{ justifyContent: 'flex-end' }}
            keyboardShouldPersistTaps="handled"
            bottomOffset={24}
          >
            <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom) }]}>
              <View style={styles.sheetGrabber} />
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>
                    {editingId ? 'Modifica evento' : 'Crea un evento'}
                  </Text>
                  <Text style={styles.modalSubTitle}>
                    {editingId
                      ? 'Aggiorna le informazioni per chi sta esplorando.'
                      : 'C’è qualcosa che succede? Mettilo sulla mappa.'}
                  </Text>
                </View>
                <Pressable
                  style={styles.closeButton}
                  onPress={() => {
                    setModal(null);
                    setFormError('');
                    Keyboard.dismiss();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Chiudi"
                >
                  <Feather name="x" size={17} color={colors.foreground} />
                </Pressable>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Titolo</Text>
                <TextInput
                  value={formDraft.title}
                  onChangeText={(title) =>
                    setFormDraft((current) => ({ ...current, title }))
                  }
                  placeholder="Es. Jazz al tramonto"
                  placeholderTextColor={colors.mutedForeground}
                  style={styles.inputField}
                  maxLength={70}
                  accessibilityLabel="Titolo evento"
                  testID="event-title-input"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Luogo</Text>
                <TextInput
                  value={formDraft.place}
                  onChangeText={(place) =>
                    setFormDraft((current) => ({ ...current, place }))
                  }
                  placeholder="Indirizzo o nome del posto"
                  placeholderTextColor={colors.mutedForeground}
                  style={styles.inputField}
                  maxLength={90}
                  accessibilityLabel="Luogo evento"
                  testID="event-place-input"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Categoria</Text>
                <View style={styles.categoryOptionRow}>
                  {CATEGORIES.map((item) => {
                    const active = formDraft.category === item;
                    const accent = categoryColor(item, colors);
                    return (
                      <Pressable
                        key={item}
                        style={[
                          styles.categoryOption,
                          active && {
                            backgroundColor: colors.accent,
                            borderColor: accent,
                          },
                        ]}
                        onPress={() =>
                          setFormDraft((current) => ({ ...current, category: item }))
                        }
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        testID={`form-category-${normalize(item)}`}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            active && { color: accent },
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Data e ora</Text>
                <TextInput
                  value={formDraft.date}
                  onChangeText={(date) =>
                    setFormDraft((current) => ({ ...current, date }))
                  }
                  placeholder="Es. 26/09/2026 21:30"
                  placeholderTextColor={colors.mutedForeground}
                  style={styles.inputField}
                  maxLength={40}
                  accessibilityLabel="Data e ora evento"
                  testID="event-date-input"
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Copertina</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.coverRow}
                  >
                    {COVER_OPTIONS.map((item) => (
                      <Pressable
                        key={item}
                        onPress={() =>
                          setFormDraft((current) => ({ ...current, image: item }))
                        }
                        style={[
                          styles.coverOption,
                          formDraft.image === item && {
                            borderColor: colors.primary,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Usa copertina ${item}`}
                        accessibilityState={{ selected: formDraft.image === item }}
                        testID={`cover-${item}`}
                      >
                        <Image
                          source={coverSource(item)}
                          style={styles.coverImage}
                          resizeMode="cover"
                        />
                      </Pressable>
                    ))}
                  </ScrollView>
                  <Pressable
                    style={styles.coverPickButton}
                    onPress={() => void chooseImage()}
                    accessibilityRole="button"
                    testID="choose-event-image"
                  >
                    <Feather name="image" size={15} color={colors.foreground} />
                    <Text style={styles.coverPickText}>Galleria</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Descrizione (facoltativa)</Text>
                <TextInput
                  value={formDraft.description}
                  onChangeText={(description) =>
                    setFormDraft((current) => ({ ...current, description }))
                  }
                  placeholder="Racconta cosa succede..."
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.inputField, styles.textArea]}
                  multiline
                  maxLength={280}
                  accessibilityLabel="Descrizione evento"
                />
              </View>
              {formError ? <Text style={styles.formError}>{formError}</Text> : null}
              {editingId && user?.isAdmin && (
                <Pressable
                  style={({ pressed }) => [
                    styles.dangerButton,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => deleteEvent(editingId)}
                  accessibilityRole="button"
                  testID="event-delete"
                >
                  <Feather name="trash-2" size={17} color="#ffffff" />
                  <Text style={styles.dangerButtonText}>Elimina evento</Text>
                </Pressable>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={submitEvent}
                accessibilityRole="button"
                testID="event-submit"
              >
                <Feather
                  name={editingId ? 'check' : 'plus'}
                  size={17}
                  color={colors.primaryForeground}
                />
                <Text style={styles.primaryButtonText}>
                  {editingId ? 'Salva modifiche' : 'Pubblica evento'}
                </Text>
              </Pressable>
            </View>
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>

      <Modal
        visible={modal === 'detail' && Boolean(selectedEvent)}
        transparent
        animationType="slide"
        onRequestClose={() => setModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={styles.modalCloseLayer}
            onPress={() => setModal(null)}
            accessibilityLabel="Chiudi dettagli evento"
          />
          {selectedEvent && (
            <View style={styles.detailSheet}>
              <View style={styles.detailImageWrap}>
                <Image
                  source={coverSource(selectedEvent.image)}
                  style={styles.detailImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['rgba(10,10,12,0.35)', 'transparent']}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <View style={styles.detailImageTools}>
                  <View style={styles.categoryTag}>
                    <Text
                      style={[
                        styles.categoryTagText,
                        { color: categoryColor(selectedEvent.category, colors) },
                      ]}
                    >
                      {selectedEvent.category.toLocaleUpperCase('it-IT')}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.iconButton}
                    onPress={() => setModal(null)}
                    accessibilityRole="button"
                    accessibilityLabel="Chiudi"
                  >
                    <Feather name="x" size={17} color={colors.foreground} />
                  </Pressable>
                </View>
              </View>
              <ScrollView
                contentContainerStyle={[
                  styles.detailBody,
                  { paddingBottom: Math.max(24, insets.bottom + 18) },
                ]}
                showsVerticalScrollIndicator={false}
              >
                <View style={{ gap: 10 }}>
                  <Text style={styles.detailTitle}>{selectedEvent.title}</Text>
                  <View style={styles.eventMetaRow}>
                    <Feather name="calendar" size={14} color={colors.primary} />
                    <Text style={styles.eventMetaText}>
                      {formatDate(selectedEvent.date)}
                    </Text>
                  </View>
                  <View style={styles.eventMetaRow}>
                    <Feather name="map-pin" size={14} color={colors.primary} />
                    <Text style={styles.eventMetaText}>
                      {selectedEvent.place}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryDivider} />
                <Text style={styles.eventDescription}>
                  {selectedEvent.description}
                </Text>
                <View style={styles.detailActionRow}>
                  <Pressable
                    style={[
                      styles.secondaryButton,
                      styles.detailAction,
                    ]}
                    onPress={() => toggleSaved(selectedEvent.id)}
                    accessibilityRole="button"
                    testID="detail-save"
                  >
                    <Feather
                      name="bookmark"
                      size={15}
                      color={
                        savedSet.has(selectedEvent.id)
                          ? colors.accentForeground
                          : colors.foreground
                      }
                      fill={
                        savedSet.has(selectedEvent.id)
                          ? colors.accentForeground
                          : 'transparent'
                      }
                    />
                    <Text style={styles.secondaryButtonText}>
                      {savedSet.has(selectedEvent.id) ? 'Salvato' : 'Salva'}
                    </Text>
                  </Pressable>
                  {user?.isAdmin && (
                    <>
                      <Pressable
                        style={[
                          styles.primaryButton,
                          styles.detailAction,
                        ]}
                        onPress={() => openEdit(selectedEvent)}
                        accessibilityRole="button"
                        testID="detail-edit"
                      >
                        <Feather
                          name="edit-2"
                          size={15}
                          color={colors.primaryForeground}
                        />
                        <Text style={styles.primaryButtonText}>Modifica</Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.dangerButton,
                          styles.detailAction,
                        ]}
                        onPress={() => deleteEvent(selectedEvent.id)}
                        accessibilityRole="button"
                        testID="detail-delete"
                      >
                        <Feather name="trash-2" size={15} color="#ffffff" />
                        <Text style={styles.dangerButtonText}>Elimina</Text>
                      </Pressable>
                    </>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}