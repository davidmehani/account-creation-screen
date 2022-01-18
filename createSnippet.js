import React, { useState, useRef } from "react";
import WBButtonFull from "./shared/buttons/WBButtonFull";
import WBFormTextInput from "./shared/inputs/WBFormTextInput";
import WBDatePicker from "./shared/inputs/WBDatePicker";
import { asyncStoreData } from "../utils/AsyncStorageUtil";
import {
  Button,
  StyleSheet,
  Text,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  ActivityIndicator,
  View,
} from "react-native";

function CreateAccountScreen({ navigation }) {
  //form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [dob, setDob] = useState("");

  //functional state (for snapping scroll to elements)
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const [fNameLayout, setFNameLayout] = useState(0);
  const [lNameLayout, setLNameLayout] = useState(0);
  const [phoneLayout, setPhoneLayout] = useState(0);
  const [emailLayout, setEmailLayout] = useState(0);
  const [usernameLayout, setUsernameLayout] = useState(0);
  const [passwordLayout, setPasswordLayout] = useState(0);
  const [confirmPasswordLayout, setConfirmPasswordLayout] = useState(0);

  const [isLoading, setIsLoading] = useState(false);

  const scrollViewRef = useRef();
  const lastNameRef = useRef();
  const phoneRef = useRef();
  const usernameRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();
  const dobRef = useRef();

  const handleScrollBehavior = (enabled, elementLayout = 0) => {
    scrollViewRef.current.scrollTo({
      x: 0,
      y: elementLayout,
      animated: true,
    });
    setScrollEnabled(enabled);
  };

  const createAlert = (message) => {
    Alert.alert("Cannot create account", message, [{ text: "Ok" }], {
      cancelable: false,
    });
  };

  const validateForm = (data) => {
    var ageDifMs = Date.now() - data.dob.getTime();
    var ageDate = new Date(ageDifMs);
    var age = Math.abs(ageDate.getUTCFullYear() - 1970);

    if (
      !data.dob ||
      data.dob === "Invalid Date" ||
      !data.email ||
      !data.first_name ||
      !data.last_name ||
      !data.password ||
      !data.confirmPassword ||
      !data.phone ||
      !data.username
    ) {
      return { validated: false, message: "All fields are required." };
    } else if (age < 13) {
      return {
        validated: false,
        message: "You must be 13 years or older to create an account.",
      };
    } else if (data.username.length < 6) {
      return {
        validated: false,
        message: "Usernames must consist of 6 or more characters.",
      };
    } else if (data.phone.length !== 10) {
      return {
        validated: false,
        message: "Please enter a valid phone number.",
      };
    } else if (
      !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
        data.email
      )
    ) {
      return {
        validated: false,
        message: "Please enter a valid email address.",
      };
    } else if (data.password.length < 6) {
      return {
        validated: false,
        message: "Passwords must consist of 6 or more characters.",
      };
    } else if (data.password !== data.confirmPassword) {
      return {
        validated: false,
        message: "Passwords do not match.",
      };
    } else {
      return {
        validated: true,
      };
    }
  };

  const registerUser = () => {
    var jsonData = {
      username: username.trim(),
      phone: phone.replace(/\D/g, ""),
      email: email.trim(),
      password: password.trim(),
      confirmPassword: confirmPassword.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      private: false,
      dob: new Date(dob),
    };

    var validated = validateForm(jsonData);
    if (!validated.validated) {
      return createAlert(validated.message);
    }
    //prepare data for request
    delete jsonData.confirmPassword;
    jsonData.dob = new Date(jsonData.dob).toLocaleDateString("fr-CA");
    jsonData.phone = "1" + jsonData.phone;

    setIsLoading(true);
    fetch(
      "",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonData),
      }
    )
      .then((response) => response.json())
      .then((json) => {
        setIsLoading(false);
        if (json.auth) {
          var jwt = json.token;
          var qrString = json.user.qr_string;
          var id = json.user._id;
          asyncStoreData("@JWT_TOKEN", jwt).then(() => {
            asyncStoreData("@QR_STRING", qrString).then(() => {
              asyncStoreData("@USER_ID", id).then(() =>
                navigation.navigate("Profile Setup")
              );
            });
          });
        } else {
          createAlert(json.message);
        }
      })
      .catch((err) => {
        setIsLoading(false);
        console.log(err);
      });
  };

  const normalizePhoneInput = (value, previousValue) => {
    if (!value) return value;
    if (
      previousValue &&
      previousValue.replace(/\D/g, "").length >= value.replace(/\D/g, "").length
    )
      return value;
    const currentValue = value.replace(/[^\d]/g, "");
    const cvLength = currentValue.length;

    if (!previousValue || value.length > previousValue.length) {
      if (cvLength < 4) return currentValue;
      if (cvLength < 7)
        return `(${currentValue.slice(0, 3)}) ${currentValue.slice(3)}`;
      return `(${currentValue.slice(0, 3)}) ${currentValue.slice(
        3,
        6
      )}-${currentValue.slice(6, 10)}`;
    }
  };

  return (
    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
      <ScrollView
        contentContainerStyle={styles.container}
        style={{ backgroundColor: "white" }}
        contentInset={{ top: 0, bottom: 150, left: 0, right: 0 }}
        scrollEnabled={scrollEnabled}
        ref={scrollViewRef}
      >
        {isLoading && (
          <View style={styles.loading}>
            <ActivityIndicator color={"gray"} />
          </View>
        )}
        <WBFormTextInput
          value={firstName}
          onChangeText={(text) => setFirstName(text)}
          placeholder="First Name"
          onFocus={() => handleScrollBehavior(true, fNameLayout)}
          onBlur={() => handleScrollBehavior(false)}
          returnKeyType="next"
          onSubmitEditing={() => lastNameRef.current.focus()}
          onLayout={(event) => setFNameLayout(event.nativeEvent.layout.y)}
        />
        <WBFormTextInput
          value={lastName}
          onChangeText={(text) => setLastName(text)}
          placeholder="Last Name"
          ref={lastNameRef}
          onFocus={() => handleScrollBehavior(true, lNameLayout)}
          onBlur={() => handleScrollBehavior(false)}
          returnKeyType="next"
          onSubmitEditing={() => phoneRef.current.focus()}
          onLayout={(event) => setLNameLayout(event.nativeEvent.layout.y)}
        />
        <WBFormTextInput
          value={phone}
          onChangeText={(text) => setPhone(normalizePhoneInput(text, phone))}
          placeholder="Phone Number"
          keyboardType="number-pad"
          ref={phoneRef}
          onFocus={() => handleScrollBehavior(true, phoneLayout)}
          onBlur={() => handleScrollBehavior(false)}
          onLayout={(event) => setPhoneLayout(event.nativeEvent.layout.y)}
        />
        <WBFormTextInput
          value={email}
          onChangeText={(text) => setEmail(text.replace(/\s/g, ""))}
          placeholder="Email Address"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoCompleteType="email"
          onFocus={() => handleScrollBehavior(true, emailLayout)}
          onBlur={() => handleScrollBehavior(false)}
          returnKeyType="next"
          onSubmitEditing={() => usernameRef.current.focus()}
          onLayout={(event) => setEmailLayout(event.nativeEvent.layout.y)}
        />
        <WBFormTextInput
          value={username}
          onChangeText={(text) => setUsername(text.replace(/\s/g, ""))}
          placeholder="Username"
          autoCapitalize="none"
          autoCorrect={false}
          autoCompleteType="username"
          ref={usernameRef}
          onFocus={() => handleScrollBehavior(true, usernameLayout)}
          onBlur={() => handleScrollBehavior(false)}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current.focus()}
          onLayout={(event) => setUsernameLayout(event.nativeEvent.layout.y)}
        />
        <WBFormTextInput
          value={password}
          onChangeText={(text) => setPassword(text.replace(/\s/g, ""))}
          placeholder="Password"
          autoCapitalize="none"
          autoCorrect={false}
          autoCompleteType="password"
          secureTextEntry={true}
          ref={passwordRef}
          onFocus={() => handleScrollBehavior(true, passwordLayout)}
          onBlur={() => handleScrollBehavior(false)}
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current.focus()}
          onLayout={(event) => setPasswordLayout(event.nativeEvent.layout.y)}
        />
        <WBFormTextInput
          value={confirmPassword}
          onChangeText={(text) => setConfirmPassword(text.replace(/\s/g, ""))}
          placeholder="Confirm Password"
          secureTextEntry={true}
          autoCapitalize="none"
          autoCorrect={false}
          autoCompleteType="off"
          ref={confirmPasswordRef}
          onFocus={() => handleScrollBehavior(true, confirmPasswordLayout)}
          onBlur={() => handleScrollBehavior(false)}
          returnKeyType="next"
          onSubmitEditing={() => dobRef.current.focus()}
          onLayout={(event) =>
            setConfirmPasswordLayout(event.nativeEvent.layout.y)
          }
        />
        <WBDatePicker
          value={dob}
          onConfirm={(date) => setDob(date)}
          placeholder="Date of Birth"
          ref={dobRef}
          onFocus={() => handleScrollBehavior(false)}
          onBlur={() => handleScrollBehavior(false)}
          headerTextIOS = "Date of Birth"
        />
        <View style={styles.buttonContainer}>
          <WBButtonFull title="Create Account" onPress={() => registerUser()} />
        </View>
        <Text style={styles.helperText}>Already have an account?</Text>
        <Button
          title="Login"
          color="#873bff"
          onPress={() => navigation.navigate("Login")}
        />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
    paddingTop: 24,
  },
  helperText: {
    marginTop: 10,
    marginBottom: 5,
  },
  loading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    width: "90%",
  },
});

export default CreateAccountScreen;
