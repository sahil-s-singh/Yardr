export interface GarageSale {
	id: string;
	title: string;
	description: string;

	location: {
		latitude: number;
		longitude: number;
		address: string;
	};

	// ISO strings
	date: string; // backward compatibility
	startDate: string;
	endDate: string;

	// e.g. "08:00"
	startTime: string;
	endTime: string;

	categories: string[];

	contactName: string;
	contactPhone?: string;
	contactEmail?: string;

	images?: string[];
	videoUrl?: string;

	isActive: boolean;
	createdAt: string;

	userId?: string;
}

export type GarageSaleCategory =
	| "furniture"
	| "clothing"
	| "electronics"
	| "toys"
	| "books"
	| "tools"
	| "kitchen"
	| "sports"
	| "other";
