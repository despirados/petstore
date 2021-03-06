package sfeir.petstore.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * Created by ayed.h on 11/02/2016.
 */
@RestController
public class UserController {

    @RequestMapping("/login")
    public Principal user(Principal user) {
        return user;
    }


    @RequestMapping(value = "/api/user/canCreate", method = RequestMethod.GET)
    @PreAuthorize("hasRole('ROLE_USER')")
    @ResponseBody
    public boolean canCreatePets( @AuthenticationPrincipal final UserDetails user) {
        for(GrantedAuthority grantedAuthority: user.getAuthorities()) {
            if (grantedAuthority.getAuthority().equals("ROLE_ADMIN")){
                return true;
            }
        }
        return false;
    }

    @RequestMapping(value = "/api/user/canDelete", method = RequestMethod.GET)
    @PreAuthorize("hasRole('ROLE_USER')")
    @ResponseBody
    public boolean canDeletePets( @AuthenticationPrincipal final UserDetails user) {
        for(GrantedAuthority grantedAuthority: user.getAuthorities()) {
            if (grantedAuthority.getAuthority().equals("ROLE_ADMIN")){
                return true;
            }
        }
        return false;
    }
}



