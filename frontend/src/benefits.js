import Notifications from '../src/assets/bell-ring.svg';
import Write from './assets/write.svg';
import Sparkle from './assets/sparkles.svg';


export default [
    {
        id: 1,
        img: {
            src: Write,
            alt: 'Feather icon'
        },
        title: 'Capture quickly',
        description: 'Title, body, color. Auto-saves while you think.'
    },
    {
        id: 2,
        img: {
            src: Notifications,
            alt: 'ringing bell icon'
        },
        title: 'Email reminders(Now Available)',
        description: 'Pick a date and time — your note arrives in your inbox.'
    },
    {
        id: 3,
        img: {
            src: Sparkle,
            alt: 'sparkles icon'
        },
        title: 'Calm by design',
        description: 'No clutter. No streaks. Just a paper desk for ideas.'
    },
]