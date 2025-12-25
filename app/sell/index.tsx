import { router } from "expo-router";
import { useEffect } from "react";

export default function SellIndex() {
	useEffect(() => {
		router.replace("/(tabs)/sell/video");
	}, []);

	return null;
}
