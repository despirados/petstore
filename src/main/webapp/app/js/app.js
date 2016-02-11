'use strict';
var url_base = "http://localhost:8080/";

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'ngCookies',
  'myApp.version'
])
    .config(['$routeProvider', function($routeProvider) {
        $routeProvider
            .when('/login', {
                templateUrl: 'partials/login.html',
                controller: 'ViewLoginCtrl'
            })
            .when('/pets', {
                templateUrl: 'partials/pets.html',
                controller: 'PetsCtrl'
            })
            .when('/pet/:petId', {
                templateUrl: 'partials/petDetails.html',
                controller: 'PetDetailsCtrl'
            })
            .when('/addPet', {
                templateUrl: 'partials/createPet.html',
                controller: 'CreatePetCtrl'
            })
            .otherwise({redirectTo: '/login'});
    }])

    .run(['$rootScope', '$location', '$cookieStore', '$http',
        function ($rootScope, $location, $cookieStore, $http) {
            // keep user logged in after page refresh
            $rootScope.authdata = $cookieStore.get('authdata') || {};
            if ($rootScope.authdata) {
              //  $http.defaults.headers.common['Authorization'] =  $rootScope.authdata;
            }

            $rootScope.$on('$locationChangeStart', function (event, next, current) {
                if ($location.path() !== '/login' && !$rootScope.authdata) {
                    $location.path('/login');
                }
            });
        }
    ])

    .controller('ViewLoginCtrl', ['$scope', '$rootScope', '$location', 'AuthenticationService'
        ,function($scope, $rootScope, $location, AuthenticationService) {
            // reset login status
            AuthenticationService.ClearCredentials();
            $scope.login = function () {
                $scope.dataLoading = true;
                AuthenticationService.Login($scope.username, $scope.password, function(response) {
                    if(response.success) {
                        $location.path('/pets');
                    } else {
                        $scope.error = response.message;
                        $scope.dataLoading = false;
                    }
                });
            };
        }
    ])

    .controller('PetsCtrl', function($scope,$route, PetsService, OpsChecksService, DeletePetService) {
        $scope.pets = null;
        PetsService.getAllPets(function(dataResponse) {
            $scope.pets = dataResponse;
        });
        OpsChecksService.canDeletePet(function (result) {
            $scope.canDeletePet = result;
        });
        OpsChecksService.canCreatePet(function (result) {
            $scope.canCreatePet = result;
        });
        $scope.deletePet =  function(petId,petName) {
            if ($scope.canDeletePet === true) {
                if (confirm("You are trying to delete "+petName+" !!") == true) {
                    DeletePetService.doDelete(function (result) {
                        if (result == true) {
                            $route.reload();
                        }else {
                            alert("Cannot do delete operation !!")
                        }
                    }, petId)
                }
            }else {
                alert("You are not authorized to do this operation !! ");
            }
            console.log("I will remove "+petId+":"+petName);
        };
    })

    .controller('PetDetailsCtrl', function($scope, $routeParams, PetsService) {
        PetsService.getPetDetails(function(dataResponse) {
            console.log(dataResponse);
            $scope.pet = dataResponse;
        }, $routeParams.petId);
    })

    .controller('CreatePetCtrl', function($scope,$http,$rootScope) {
        $scope.image = null;
        $scope.newPet = {};
        $scope.newPet.category = {};
        $scope.newPet.tags = [];
        $scope.newPet.tags.push({key:"", value:""});
        $scope.newPet.name = "No Name";
        $scope.newPet.category.name = "Dog";
        $scope.newPet.status = "AVAILABLE";


        $scope.createPet = function() {
            console.log($scope.image);
            if ($scope.newPet.name != '') {
                //save the image if any !!
                if ($scope.image!=null) {
                    var fd = new FormData();
                    //Take the first selected file
                    fd.append("file", $scope.image[0]);
                    fd.append("name", $scope.newPet.name);
                    $http({
                        method: 'POST',
                        data: fd,
                        url: url_base+'/pet/image/upload',
                        headers: {'Authorization': $rootScope.authdata, 'Content-Type': undefined},
                        transformRequest: angular.identity
                    }).success(function(result){
                        $scope.newPet.imageUrl=null;
                        $scope.newPet.imageUrl=result.imageUrl;
                    }).error(function(){
                        console.log('Error');
                    });
                }
            }
        };
        $scope.updateNewPet = function() {
            var length = $scope.newPet.tags.length;
            var tags = $scope.newPet.tags;
            if (length == 0 || tags[length-1].key != '') {
                tags.push({key:"", value:""});
            }
        };
        $scope.uploadFile = function(files) {
            $scope.image = files;
        };
    })

    .service('PetsService', function($http,$rootScope) {
        delete $http.defaults.headers.common['X-Requested-With'];
        this.getAllPets = function(callbackFunc) {
            $http({
                method: 'GET',
                url: url_base+'/pet',
                headers: {'Authorization': $rootScope.authdata}
            }).success(function(data){
                callbackFunc(data);
            }).error(function(){
                console.log('Error');
            });
        };
        this.getPetDetails = function(callbackFunc, petId) {
            $http({
                method: 'GET',
                url: url_base+'/pet/'+petId,
                headers: {'Authorization': $rootScope.authdata}
            }).success(function(data){
                callbackFunc(data);
            }).error(function(){
                console.log('Error');
            });
        }
    })

    .service('DeletePetService', function($http,$rootScope) {
        this.doDelete = function(callbackFunc, petId) {
            $http({
                method: 'DELETE',
                url: url_base+'/pet/'+petId,
                headers: {'Authorization': $rootScope.authdata}
            }).success(function(){
                callbackFunc(true);
            }).error(function(){
                callbackFunc(true);
            });
        }
    })

    .service('OpsChecksService', function($http,$rootScope) {
        this.canDeletePet = function(callbackFunc) {
            $http({
                method: 'GET',
                url: url_base+'/user/canDelete',
                headers: {'Authorization': $rootScope.authdata}
            }).success(function(data){
                callbackFunc(data===true);
            }).error(function(){
                return callbackFunc(false);
            });
        };
        this.canCreatePet = function(callbackFunc) {
            $http({
                method: 'GET',
                url: url_base+'/user/canCreate',
                headers: {'Authorization': $rootScope.authdata}
            }).success(function(data){
                callbackFunc(data===true);
            }).error(function(){
                return callbackFunc(false);
            });
        }
    })

    .factory('AuthenticationService', ['$cookieStore', '$rootScope', '$timeout',
        function ($cookieStore, $rootScope, $timeout) {
            var service = {};
            service.Login = function (username, password, callback) {
                $timeout(function(){
                    var response = { success: false };
                    //TODO: implements this !!
                    if (username==='user2' && password==='secret2') {
                        $rootScope.authdata = "Basic dXNlcjI6c2VjcmV0Mg==";
                        response.success = true;
                    }else if (username==='user1' && password==='secret1') {
                        $rootScope.authdata = "Basic dXNlcjE6c2VjcmV0MQ==";
                        response.success = true;
                    }else {
                        $rootScope.authdata = null;
                    }

                    callback(response);
                }, 1000);
            };

            service.ClearCredentials = function () {
                $rootScope.authdata = {};
                $cookieStore.remove('authdata');
            };

            return service;
    }])

    .filter('availableFilterIcon', function() {
        return function(isAvailable) {
            return (isAvailable == "AVAILABLE") ? "glyphicon glyphicon-ok" : "glyphicon glyphicon-remove";
        };
    })

    .filter('availableFilterClass', function() {
        return function(isAvailable) {
            return (isAvailable == "AVAILABLE") ? "success" : "danger";
        };
    })

;

