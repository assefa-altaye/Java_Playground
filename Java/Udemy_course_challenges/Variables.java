package Udemy_course_challenges;
import java.lang.*;

class Variables{
	public static void main(String[] args){
	
	byte b=5;
	short s=400;
	int i=4765;
	float f=786.7f;
	char c='A';

	System.out.println("byte: " + b);
	System.out.println("short: " + s);
	System.out.println("int: " + i);
	System.out.println("float: " + f);
	System.out.println("char: " + c);
	//error because Max_Value for byte is 127, 153 is out of range 
	//b=153;
	//System.out.println(b);
	}
}