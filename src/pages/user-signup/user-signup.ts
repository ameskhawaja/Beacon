import { Component } from '@angular/core';
import { IonicPage, NavController, LoadingController, Loading, AlertController, MenuController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthProvider } from '../../providers/auth/auth';
import { EmailValidator } from '../../validators/email';
import { PasswordValidator } from '../../validators/password';
import { FeedPage } from '../feed/feed';

import { Camera , CameraOptions} from '@ionic-native/camera'; //added 3/31 by Amanda
import firebase from 'firebase';

@IonicPage()
@Component({
  selector: 'page-user-signup',
  templateUrl: 'user-signup.html',
})
export class UserSignupPage {
  public signupForm:FormGroup;
  public loading:Loading;

  public capturedDataURL;
  public ppURL;

  constructor(public menuCtrl: MenuController, public navCtrl: NavController, public loadingCtrl: LoadingController, 
  public alertCtrl: AlertController, public formBuilder: FormBuilder, 
  public authProvider: AuthProvider, public camera: Camera) {
    this.menuCtrl.enable(false, 'navMenu');

    this.signupForm = formBuilder.group({
      name: ['', Validators.required],
      email: ['', Validators.compose([Validators.required, EmailValidator.isValid])],
      password: ['', Validators.compose([Validators.minLength(6), Validators.required])],
      password2: ['', Validators.compose([Validators.minLength(6), Validators.required, PasswordValidator.passwordsMatch])],
      phone: ['', Validators.compose([Validators.minLength(10), Validators.maxLength(10), Validators.required])],
    });
  }

 //pull profile pick in when page is fully loaded
  ionViewWillEnter(){
    this.ppURL = "assets/imgs/blank-profile-picture.jpg";
  }

  signupUser(){
    if (!this.signupForm.valid){   
      //user feed back  
      if (this.signupForm.value.name == '' || this.signupForm.value.email == '' || this.signupForm.value.phone == '' || this.signupForm.value.password == ''){
        let alert = this.alertCtrl.create({
          title: 'Error!',
          subTitle: 'We are still missing some of your infomation. Please make sure to provide all of the information in order to sign up.',
          buttons: ['Dismiss']
        });
        alert.present(); 
      }
      console.log(this.signupForm.value);


    } else {
      this.authProvider.signupUser(this.signupForm.value.name, this.signupForm.value.email, this.signupForm.value.password, this.signupForm.value.phone)
      .then(() => {
        this.loading.dismiss().then( () => {
          this.navCtrl.setRoot(FeedPage);
        });
      }, (error) => {
        this.loading.dismiss().then( () => {
          var errorMessage: string = error.message;
          let alert = this.alertCtrl.create({
            message: errorMessage,
            buttons: [{ text: "Ok", role: 'cancel' }]
          });
          alert.present();
        });
      });

      this.loading = this.loadingCtrl.create();
      this.loading.present();
    }
  }

  returnToLogin()
  {
     this.navCtrl.popTo( this.navCtrl.getByIndex(0));
  }

  /**  All code below added by Amanda for image features */
  
  async takePhoto(){ //takes image with camera
    const options: CameraOptions = {
        quality: 40,
        destinationType: this.camera.DestinationType.DATA_URL, //gives image back as base 64 image
        encodingType: this.camera.EncodingType.JPEG,
        mediaType: this.camera.MediaType.PICTURE, //only looks for pictures
        saveToPhotoAlbum: true, //saving picture to library  
        correctOrientation: true 
    }
    this.camera.getPicture(options).then((imageData) => { 
      this.capturedDataURL = 'data:image/jpeg;base64,' + imageData;
      //uploading the picture
      let storageRef = firebase.storage().ref();
      const filename = this.signupForm.value.email; //naming the file to match the current user's email
      const imageRef = storageRef.child('profilePics/' + filename + '.jpg'); //places picture ref in folder of profile pics with UID as name of file
      imageRef.putString(this.capturedDataURL, firebase.storage.StringFormat.DATA_URL);
      this.ppURL = this.capturedDataURL;//updates photo url to new photo url
        //user feed back
      let alert = this.alertCtrl.create({
        title: 'Success!',
        subTitle: 'Your profile picture has been set.',
        buttons: ['Dismiss']
      });
      alert.present();
    },
    (err) => {
      //user feed back
      let alert = this.alertCtrl.create({
        title: 'Error!',
        subTitle: 'There was a problem uplaoding you picture. Please try again.',
        buttons: ['Dismiss']
      });
      alert.present();
    });
  }


  
  async getPhoto(){ //pulls from library
    const options: CameraOptions = {
        quality: 40,
        destinationType: this.camera.DestinationType.DATA_URL, //gives image back as base 64 image
        sourceType: this.camera.PictureSourceType.PHOTOLIBRARY,
        saveToPhotoAlbum: false,
        correctOrientation: true 
    }
    
    // code modified from ionic documentation and Maballo Net: pick from gallary
    this.camera.getPicture(options).then((imageData) => { 
      this.capturedDataURL = 'data:image/jpeg;base64,' + imageData;
      //uploading the picture
      let storageRef = firebase.storage().ref();
      const filename = this.signupForm.value.email; //naming the file to match the current user's email
      const imageRef = storageRef.child('profilePics/' + filename + '.jpg'); //places picture ref in folder of profile pics with user's email as name of file
      imageRef.putString(this.capturedDataURL, firebase.storage.StringFormat.DATA_URL);
      this.ppURL = this.capturedDataURL;//updates photo url to new photo url
      //user feed back
      let alert = this.alertCtrl.create({
        title: 'Success!',
        subTitle: 'Your profile picture has been updated.',
        buttons: ['Dismiss']
      });
      alert.present();
    },
    (err) => {
      //user feed back
      let alert = this.alertCtrl.create({
        title: 'Error!',
        subTitle: 'There was a problem uplaoding you picture. Please try again.',
        buttons: ['Dismiss']
      });
      alert.present();
    });
  }


}
