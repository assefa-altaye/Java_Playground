//import java.lang.*;
import java.util.*;
public class ReadKeyBoard {
    public static void main(String args[]){
        Scanner sc=new Scanner(System.in);
        int x,y;
        System.out.println("Enter two numbers");
        x=sc.nextInt();
        y=sc.nextInt();
        int z= x+y;
        System.out.println("Sum of two numbers is: " + z);
    }
}
