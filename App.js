import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Button, StyleSheet, View, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
	handleNotification: async () => {
		return {
			shouldPlaySound: true,
			shouldSetBadge: false,
			shouldShowAlert: true
		};
	}
});

const allowNotificationAsync = async () => {
	const settings = await Notifications.getPermissionsAsync();
	return (
		settings.granted ||
		settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
	);
};

const requestPermissionAsync = async () => {
	return await Notifications.requestPermissionsAsync({
		ios: {
			allowAlert: true,
			allowBadge: true,
			allowSound: true,
			allowAnnouncements: true
		}
	});
};

export default function App() {
	useEffect(() => {
		const configurePushNotifications = async () => {
			const { status } = await Notifications.getPermissionsAsync();
			let finalStatus = status;

			if (finalStatus !== 'granted') {
				const { status } = await Notifications.requestPermissionsAsync();
				finalStatus = status;
			}

			if (finalStatus !== 'granted') {
				Alert.alert(
					'Permission required',
					'Push notifications need the appropriate permissions.'
				);
				return;
			}

			const pushTokenData = await Notifications.getExpoPushTokenAsync();

			console.log(pushTokenData);

			if (Platform.OS === 'android') {
				Notifications.setNotificationChannelAsync('default', {
					name: 'default',
					importance: Notifications.AndroidImportance.DEFAULT
				});
			}
		};

		configurePushNotifications();
	}, []);

	useEffect(() => {
		const subscription1 = Notifications.addNotificationReceivedListener(
			notification => {
				console.log('NOTIFICATION RECEIVED');
				console.log(notification);
				const userName = notification.request.content.data.userName;
				console.log(userName);
			}
		);

		const subscription2 = Notifications.addNotificationResponseReceivedListener(
			response => {
				console.log('NOTIFICATION RESPONSE RECEIVED');
				console.log(response);
				const userName = response.notification.request.content.data.userName;
				console.log(userName);
			}
		);

		return () => {
			subscription1.remove();
			subscription2.remove();
		};
	}, []);

	const scheduleNotificationHandler = async () => {
		const hasPushNotificationPermissionGranted = await allowNotificationAsync();

		if (!hasPushNotificationPermissionGranted) {
			await requestPermissionAsync();
		}

		Notifications.scheduleNotificationAsync({
			content: {
				title: 'My first local notification',
				body: 'This is the body of the notification',
				data: { userName: 'Stefan' }
			},
			trigger: {
				seconds: 5
			}
		});
	};

	const sendPushNotificationHandler = () => {
		fetch('https://exp.host/--/api/v2/push/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				to: 'ExponentPushToken[C3jqGWEw6Tlv45JRyJjbwL]',
				title: 'Test - sent from a device!',
				body: 'This is a strong test!'
			})
		});
	};

	return (
		<View style={styles.container}>
			<Button
				title='Schedule Notification'
				onPress={scheduleNotificationHandler}
			/>
			<Button
				title='Send Push Notification'
				onPress={sendPushNotificationHandler}
			/>
			<StatusBar style='auto' />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center'
	}
});
