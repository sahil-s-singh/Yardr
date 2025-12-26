// app/sell/index.tsx
import { router } from "expo-router";
import { useEffect } from "react";

export default function SellIndex() {
	useEffect(() => {
		// Immediately redirect to video screen
		router.replace("/sell/video");
	}, []);

	return null;
}
