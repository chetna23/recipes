import { AuthService } from './auth.service';
import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, UrlTree, Router } from "@angular/router";
import { Observable } from "rxjs";
import { map, tap } from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {

    constructor(private authService: AuthService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
        return this.authService.user.pipe(map(user => {
            //for truish values.
            const isAuth = !!user;
            if(isAuth) return true;
            return this.router.createUrlTree(['/auth']);
        }))
        // tap(isAuth => {
        //     if(!isAuth) {
        //         this.router.navigate(['/auth']);
        //     }
        // }
        // ));
    }

}