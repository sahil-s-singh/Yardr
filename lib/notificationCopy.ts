// lib/notificationCopy.ts
// Playful, randomized notification copy so Yardr alerts feel delightful,
// not robotic. Keep titles punchy (≤30 chars) and bodies under ~90 chars so
// they render well on iOS and Android lock screens.

type WishlistMatchVars = {
	itemName: string;
	saleTitle: string;
};

type ReminderVars = {
	saleTitle: string;
};

const WISHLIST_MATCH_TEMPLATES: Array<
	(v: WishlistMatchVars) => { title: string; body: string }
> = [
	(v) => ({
		title: "Treasure alert 🪙",
		body: `"${v.saleTitle}" just listed ${v.itemName} — go snag it before someone else does.`,
	}),
	(v) => ({
		title: "Your hunt paid off 🎯",
		body: `"${v.saleTitle}" might have the ${v.itemName} you've been looking for.`,
	}),
	(v) => ({
		title: "Yardr found it 👀",
		body: `Looks like "${v.saleTitle}" has ${v.itemName} on deck. Dibs?`,
	}),
	(v) => ({
		title: "A match, nearby ✨",
		body: `${v.itemName} spotted at "${v.saleTitle}". It's your call.`,
	}),
	(v) => ({
		title: "Drop everything 🏃",
		body: `"${v.saleTitle}" is selling what you want: ${v.itemName}.`,
	}),
	(v) => ({
		title: "Wishlist hit 💫",
		body: `Someone near you is letting go of ${v.itemName}. Check "${v.saleTitle}".`,
	}),
	(v) => ({
		title: "One for your list 📝",
		body: `"${v.saleTitle}" just matched your wishlist — ${v.itemName} is waiting.`,
	}),
	(v) => ({
		title: "Good news 🎉",
		body: `That ${v.itemName} you wanted? It's at "${v.saleTitle}".`,
	}),
];

const REMINDER_TEMPLATES: Array<
	(v: ReminderVars) => { title: string; body: string }
> = [
	(v) => ({
		title: "Don't forget 📍",
		body: `"${v.saleTitle}" is about to kick off. Grab your bag and go.`,
	}),
	(v) => ({
		title: "Sale starting ⏰",
		body: `"${v.saleTitle}" is happening soon — you saved it for a reason.`,
	}),
	(v) => ({
		title: "It's go time 🏁",
		body: `"${v.saleTitle}" is opening up. The early bird gets the good stuff.`,
	}),
	(v) => ({
		title: "Heads up 👋",
		body: `"${v.saleTitle}" kicks off any minute now.`,
	}),
	(v) => ({
		title: "Your reminder ⏳",
		body: `"${v.saleTitle}" starts soon — don't sleep on it.`,
	}),
];

function pick<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export function wishlistMatchCopy(vars: WishlistMatchVars) {
	return pick(WISHLIST_MATCH_TEMPLATES)(vars);
}

export function reminderCopy(vars: ReminderVars) {
	return pick(REMINDER_TEMPLATES)(vars);
}
