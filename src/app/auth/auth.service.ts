import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from "@angular/core";
import { catchError, tap, exhaustMap } from 'rxjs/operators';
import { throwError, Subject, BehaviorSubject } from 'rxjs';
import { User } from './user.model';

export interface AuthResponseData {
  kind: string,
  idToken: string,
  displayName: string,
  profilePicture?: string,
  email: string,
  refreshToken: string,
  expiresIn: string,
  localId: string,
  mfaPendingCredential?: string,
  mfaInfo?: [ object]
}

@Injectable({providedIn: 'root'})
export class AuthService {

    user = new BehaviorSubject<User>(null);
    tokenExpirationTimer: any;
    constructor( private http: HttpClient, private router: Router ) {
    }

    signup(email: string, password: string) {
        return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyB4GCPgTMKORoISC070Z5pfhDVKOP3LJ2A', 
        {
            email: email,
            password: password
        }).pipe(catchError(this.handleEror), tap(resData => {
            this.handleAuthentication(resData.email, resData.localId, resData.idToken, +resData.expiresIn)
        }));
    }

    login(email: string, password: string) {
        return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyB4GCPgTMKORoISC070Z5pfhDVKOP3LJ2A',
        {
            email: email,
            password: password
        }).pipe(catchError(this.handleEror), tap(resData => {
            this.handleAuthentication(resData.email, resData.localId, resData.idToken, +resData.expiresIn)
        }));
    }

    autoLogin() {
        const userData : {
            email: string, 
            id: string,
            _token: string,
            _tokenExpirationDate: string
        } = JSON.parse(localStorage.getItem('userData'));
        if(!userData) {
            return;
        }
        const loadedUser = new User(userData.email, userData.id, userData._token, new Date(userData._tokenExpirationDate));

        if(loadedUser.token) {
            this.user.next(loadedUser);
            const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
            this.autoLogout(expirationDuration)
        }
    }

    autoLogout(expirationDuration: number) {
        this.tokenExpirationTimer = setTimeout(() => {
            this.logout()
        }, expirationDuration);
    }

    logout() {
        this.user.next(null);
        this.router.navigate(['/auth']);
        localStorage.removeItem('userData');
        if(this.tokenExpirationTimer) {
            clearTimeout(this.tokenExpirationTimer);
        }
        this.tokenExpirationTimer = null;
    }
    
    private handleAuthentication( email: string, userId: string, token: string, expiresIn: number) {
        const expirationDate = new Date(new Date().getTime() + expiresIn * 1000)
            const user = new User(email, userId, token, expirationDate);
            this.user.next(user);
            this.autoLogout(expiresIn * 1000);
            localStorage.setItem('userData', JSON.stringify(user));
    }
    private handleEror(errorRes: HttpErrorResponse) {
        let errorMessage = 'An unknown error occured';
            if (!errorRes.error || !errorRes.error.error) {
                return throwError(errorMessage);
            }
            switch( errorRes.error.error.message) {
                case 'EMAIL_EXISTS': errorMessage = 'This email already exists';
                break;
                case 'EMAIL_NOT_FOUND': errorMessage = 'This email does not exist';
                break;
                case 'INVALID_PASSWORD': errorMessage = 'This password is not correct';
                break;
              }
            return throwError(errorMessage);
    }

}