from django import forms

class NewPost(forms.Form):
    post = forms.CharField(label="Type Something", 
                           widget=forms.Textarea(attrs={'class': 'form-control', 'rows': 4}), 
                           max_length=200
                           )