public class Main {

    public static void main(String[] args){
        //Variables

        int age=30;
        int year =2025;
        int quantity= 1;

        double price=19500.99;
        double gpa=3.5;
        double temperature=-12.5;

        char grade='A';
        char symbol='!';
        char currency='$';

        boolean isStudent=true;
        boolean forSale=false;
        boolean isOnline=true;

        String name="Asse Kops";
        String car="Chevrolet";
        String color= "Red";

        System.out.println("Your choice is: " + color + " " + year + " " + car);
        System.out.println("The price is: " + currency + price);

        if(forSale){
            System.out.println("Your favorite car " + car + " is for sale");
        }
        else {
            System.out.println("Your favorite car " + car + " is not for sale");
        }
    }

}
