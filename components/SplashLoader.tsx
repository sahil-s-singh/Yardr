import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";

// SVG background & decorative elements
import BgGrid from "@/assets/splash/bg-grid.svg";
import House1 from "@/assets/splash/house1.svg";
import House2 from "@/assets/splash/house2.svg";
import House3 from "@/assets/splash/house3.svg";
import House4 from "@/assets/splash/house4.svg";
import House5 from "@/assets/splash/house5.svg";
import House6 from "@/assets/splash/house6.svg";
import House7 from "@/assets/splash/house7.svg";
import House8 from "@/assets/splash/house8.svg";
import House9 from "@/assets/splash/house9.svg";
import House10 from "@/assets/splash/house10.svg";
import Heart1 from "@/assets/splash/heart1.svg";
import Heart2 from "@/assets/splash/heart2.svg";
import Heart3 from "@/assets/splash/heart3.svg";
import Heart4 from "@/assets/splash/heart4.svg";
import Heart5 from "@/assets/splash/heart5.svg";
import Heart6 from "@/assets/splash/heart6.svg";
import Heart7 from "@/assets/splash/heart7.svg";
import Pin1 from "@/assets/splash/pin1.svg";
import Pin2 from "@/assets/splash/pin2.svg";
import Pin3 from "@/assets/splash/pin3.svg";
import Pin4 from "@/assets/splash/pin4.svg";
import Pin5 from "@/assets/splash/pin5.svg";
import Pin6 from "@/assets/splash/pin6.svg";
import Star1 from "@/assets/splash/star1.svg";
import Star2 from "@/assets/splash/star2.svg";
import Star3 from "@/assets/splash/star3.svg";
import Star4 from "@/assets/splash/star4.svg";
import Star5 from "@/assets/splash/star5.svg";
import Star6 from "@/assets/splash/star6.svg";
import Star7 from "@/assets/splash/star7.svg";
import Lock1 from "@/assets/splash/lock1.svg";
import Lock2 from "@/assets/splash/lock2.svg";
import Lock3 from "@/assets/splash/lock3.svg";
import Lock4 from "@/assets/splash/lock4.svg";
import Lock5 from "@/assets/splash/lock5.svg";
import Tree1 from "@/assets/splash/tree1.svg";
import Tree2 from "@/assets/splash/tree2.svg";
import Tree3 from "@/assets/splash/tree3.svg";
import Tree4 from "@/assets/splash/tree4.svg";
import Mappin1 from "@/assets/splash/mappin1.svg";
import Mappin2 from "@/assets/splash/mappin2.svg";
import Mappin3 from "@/assets/splash/mappin3.svg";
import Mappin4 from "@/assets/splash/mappin4.svg";
import Mappin5 from "@/assets/splash/mappin5.svg";
import LogoCenter from "@/assets/splash/logo-center.svg";

const { width, height } = Dimensions.get("window");
const scaleX = width / 390;
const scaleY = height / 844;

function S(x: number, y: number, w: number, h: number) {
	return {
		position: "absolute" as const,
		left: x * scaleX,
		top: y * scaleY,
		width: w * scaleX,
		height: h * scaleY,
	};
}

export default function SplashLoader({ onFinish }: { onFinish: () => void }) {
	const logoScale = useRef(new Animated.Value(0.6)).current;
	const logoOpacity = useRef(new Animated.Value(0)).current;
	const textOpacity = useRef(new Animated.Value(0)).current;
	const bgOpacity = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.sequence([
			// Background elements fade in
			Animated.timing(bgOpacity, {
				toValue: 1,
				duration: 500,
				useNativeDriver: true,
			}),
			// Logo springs in
			Animated.parallel([
				Animated.spring(logoScale, {
					toValue: 1,
					friction: 6,
					tension: 40,
					useNativeDriver: true,
				}),
				Animated.timing(logoOpacity, {
					toValue: 1,
					duration: 400,
					useNativeDriver: true,
				}),
			]),
			// Text fades in
			Animated.timing(textOpacity, {
				toValue: 1,
				duration: 300,
				useNativeDriver: true,
			}),
			// Hold
			Animated.delay(800),
		]).start(() => onFinish());
	}, []);

	return (
		<View style={styles.container}>
			{/* Background grid & dotted path */}
			<View style={S(0, 0, 390, 844)}>
				<BgGrid width={390 * scaleX} height={844 * scaleY} />
			</View>

			{/* All decorative elements at exact Figma positions */}
			<Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacity }]}>
				{/* Houses */}
				<View style={S(30, 100, 45, 45)}><House1 width={45 * scaleX} height={45 * scaleY} /></View>
				<View style={S(280, 140, 40, 40)}><House2 width={40 * scaleX} height={40 * scaleY} /></View>
				<View style={S(140, 260, 50, 50)}><House3 width={50 * scaleX} height={50 * scaleY} /></View>
				<View style={S(310, 300, 35, 35)}><House4 width={35 * scaleX} height={35 * scaleY} /></View>
				<View style={S(50, 380, 43, 43)}><House5 width={43 * scaleX} height={43 * scaleY} /></View>
				<View style={S(260, 440, 38, 38)}><House6 width={38 * scaleX} height={38 * scaleY} /></View>
				<View style={S(100, 560, 40, 40)}><House7 width={40 * scaleX} height={40 * scaleY} /></View>
				<View style={S(300, 600, 45, 45)}><House8 width={45 * scaleX} height={45 * scaleY} /></View>
				<View style={S(40, 700, 35, 35)}><House9 width={35 * scaleX} height={35 * scaleY} /></View>
				<View style={S(220, 720, 40, 40)}><House10 width={40 * scaleX} height={40 * scaleY} /></View>

				{/* Hearts */}
				<View style={S(120, 130, 24, 22)}><Heart1 width={24 * scaleX} height={22 * scaleY} /></View>
				<View style={S(230, 220, 19, 18)}><Heart2 width={19 * scaleX} height={18 * scaleY} /></View>
				<View style={S(70, 320, 17, 15)}><Heart3 width={17 * scaleX} height={15 * scaleY} /></View>
				<View style={S(330, 380, 22, 20)}><Heart4 width={22 * scaleX} height={20 * scaleY} /></View>
				<View style={S(180, 520, 19, 18)}><Heart5 width={19 * scaleX} height={18 * scaleY} /></View>
				<View style={S(50, 620, 17, 15)}><Heart6 width={17 * scaleX} height={15 * scaleY} /></View>
				<View style={S(310, 700, 24, 22)}><Heart7 width={24 * scaleX} height={22 * scaleY} /></View>

				{/* Map pins */}
				<View style={S(75, 160, 24, 34)}><Pin1 width={24 * scaleX} height={34 * scaleY} /></View>
				<View style={S(190, 320, 20, 28)}><Pin2 width={20 * scaleX} height={28 * scaleY} /></View>
				<View style={S(305, 485, 22, 31)}><Pin3 width={22 * scaleX} height={31 * scaleY} /></View>
				<View style={S(78, 490, 18, 25)}><Pin4 width={18 * scaleX} height={25 * scaleY} /></View>
				<View style={S(190, 645, 20, 28)}><Pin5 width={20 * scaleX} height={28 * scaleY} /></View>
				<View style={S(310, 175, 16, 22)}><Pin6 width={16 * scaleX} height={22 * scaleY} /></View>

				{/* Trees */}
				<View style={S(200, 160, 22, 26)}><Tree1 width={22 * scaleX} height={26 * scaleY} /></View>
				<View style={S(100, 450, 20, 23)}><Tree2 width={20 * scaleX} height={23 * scaleY} /></View>
				<View style={S(340, 550, 24, 29)}><Tree3 width={24 * scaleX} height={29 * scaleY} /></View>
				<View style={S(60, 250, 18, 21)}><Tree4 width={18 * scaleX} height={21 * scaleY} /></View>

				{/* Locks */}
				<View style={S(170, 400, 24, 24)}><Lock1 width={24 * scaleX} height={24 * scaleY} /></View>
				<View style={S(290, 250, 20, 20)}><Lock2 width={20 * scaleX} height={20 * scaleY} /></View>
				<View style={S(40, 540, 18, 18)}><Lock3 width={18 * scaleX} height={18 * scaleY} /></View>
				<View style={S(240, 580, 22, 22)}><Lock4 width={22 * scaleX} height={22 * scaleY} /></View>
				<View style={S(130, 680, 16, 16)}><Lock5 width={16 * scaleX} height={16 * scaleY} /></View>

				{/* Stars */}
				<View style={S(150, 110, 12, 12)}><Star1 width={12 * scaleX} height={12 * scaleY} /></View>
				<View style={S(250, 300, 10, 10)}><Star2 width={10 * scaleX} height={10 * scaleY} /></View>
				<View style={S(340, 430, 14, 14)}><Star3 width={14 * scaleX} height={14 * scaleY} /></View>
				<View style={S(80, 470, 11, 11)}><Star4 width={11 * scaleX} height={11 * scaleY} /></View>
				<View style={S(200, 600, 10, 10)}><Star5 width={10 * scaleX} height={10 * scaleY} /></View>
				<View style={S(120, 740, 12, 12)}><Star6 width={12 * scaleX} height={12 * scaleY} /></View>
				<View style={S(300, 760, 9, 9)}><Star7 width={9 * scaleX} height={9 * scaleY} /></View>

				{/* More map pins (different sizes) */}
				<View style={S(110, 200, 18, 28)}><Mappin1 width={18 * scaleX} height={28 * scaleY} /></View>
				<View style={S(330, 230, 14, 22)}><Mappin2 width={14 * scaleX} height={22 * scaleY} /></View>
				<View style={S(50, 440, 16, 25)}><Mappin3 width={16 * scaleX} height={25 * scaleY} /></View>
				<View style={S(240, 360, 13, 20)}><Mappin4 width={13 * scaleX} height={20 * scaleY} /></View>
				<View style={S(350, 640, 18, 28)}><Mappin5 width={18 * scaleX} height={28 * scaleY} /></View>
			</Animated.View>

			{/* Center logo */}
			<Animated.View
				style={[
					styles.logoWrap,
					{ opacity: logoOpacity, transform: [{ scale: logoScale }] },
				]}
			>
				<LogoCenter width={140 * scaleX} height={140 * scaleY} />
			</Animated.View>

			{/* Brand text */}
			<Animated.Text style={[styles.brand, { opacity: textOpacity }]}>
				yardr
			</Animated.Text>

			{/* Tagline */}
			<Animated.Text style={[styles.tagline, { opacity: textOpacity }]}>
				meet local. sell fun.
			</Animated.Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFF5ED",
		alignItems: "center",
		justifyContent: "center",
	},
	logoWrap: {
		marginBottom: 8,
	},
	brand: {
		fontSize: 52,
		fontWeight: "900",
		color: "#E0734E",
		letterSpacing: -2,
	},
	tagline: {
		fontSize: 14,
		color: "#8C7366",
		letterSpacing: 3,
		marginTop: 4,
	},
});
